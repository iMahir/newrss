import { launch } from "puppeteer";
import { Feed, FeedData } from "./rss";
import { gptPollinations } from "./gpt/pollinations";
import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

export const resolveArticle = async (feed: Feed) => {

    // Split feed.data into chunks of 10 and use setInterval to loop over them every 5 seconds
    const chunkSize = 10;
    const chunks = feed.data.reduce((resultArray: FeedData[][], item, index) => {
        const chunkIndex = Math.floor(index / chunkSize);
        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [];
        }
        resultArray[chunkIndex].push(item);
        return resultArray;
    }, []);



    let i = 0;
    for (const chunk of chunks) {

        const browser = await launch({ headless: true });

        let pages = [];
        for (let i = 0; i < chunkSize; i++) {
            const page = await browser.newPage();
            await page.setRequestInterception(true);

            page.on('request', (request) => {

                if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            pages.push(page);
        }


        await Promise.all(chunk.map(async (item, indx) => {
            const page = pages[indx];
            i++;
            console.log(i)
            try {
                await page.goto(item.link, { waitUntil: "domcontentloaded", timeout: 20000 });
                await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => { });

                item.link = page.url();

                const content = await page.content();
                const summary = await generateArticleSummary(content);

                item.summary = summary ?? null;
                if (summary === "") item.summary = null;

            } catch (error) {
                console.error(`Error processing URL: ${item.link}`, error);
                item.link = item.link; // Fallback to the original URL on error
            }
        }));

        await browser.close();
    }


    // merge chunks back into feed.data
    feed.data = chunks.flat();

    return feed;
}


const generateArticleSummary = async (content: string) => {

    const virtualConsole = new VirtualConsole()
    const doc = new JSDOM(content, { virtualConsole });

    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    if (!article) return null;

    const truncatedString = truncateStringToTokenCount(article.content, 3500);

    const prompt = [
        { "role": "system", "content": "You are a helpful assistant." },
        {
            "role": "user", "content": `
            Summarize the following news article in a structured format suitable for a webpage. The summary should include key details such as the title, publication date, source, main points, relevant images (if available), and any notable quotes or statistics. Format the summary in clean HTML, using semantic tags and appropriate styles for readability. If the article includes a main image, incorporate it with an <img> tag and a <figcaption> for the caption. If no image is available, exclude this section. Follow this structure:

Title: Use <h1> for the article title.
Date & Source: Use a <p> tag with a <strong> label for the publication date and source.
Image with Caption: If available, use an <img> tag for the image and include a <figcaption> for the caption.
Introduction: Use a <p> tag to provide a brief overview of the article in 1–2 sentences.
Key Points: Use an ordered list (<ol>) or unordered list (<ul>) to highlight the main points covered in the article.
Notable Quotes or Statistics: Use blockquote (<blockquote>) for important quotes or data.
Conclusion: Use a <p> tag for a brief conclusion or takeaway from the article.
            `},
        { "role": "user", "content": `Don't include \`\`\`html ....\`\`\` in your response. Only respond in string.` },
        { "role": "user", "content": `If it says access denied in the article content then respond with "null" as a string only.` },
        { "role": "user", "content": `The title of the article is ${article.title}.` },
        { "role": "user", "content": `The article is as follows: \n${truncatedString}` }
    ];

    const gptResponse = await gptPollinations(prompt);
    if (gptResponse === "null") return null;
    return gptResponse;

    // function that takes a string and truncates it to a word boundary of given word count
    function truncateStringToTokenCount(str: string, num: number) {
        return str.split(/\s+/).slice(0, num).join(" ");
    }
}