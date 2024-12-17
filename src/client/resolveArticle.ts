import { launch } from "puppeteer";
import { Feed, FeedData } from "./rss";
import { gptPollinations } from "./gpt/pollinations";
import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import { writeData } from "../config";

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

        const browser = await launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

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
                const parsedArticle = await generateArticleSummary(content);

                item.summary = parsedArticle.summary;
                item.significance = parsedArticle.significance;
                item.newTitle = parsedArticle.newTitle;

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
    if (!article) return {
        title: null,
        newTitle: null,
        summary: null,
        significance: null
    };

    const truncatedArticle = truncateStringToTokenCount(article.content, 3500);


    const prompt = [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Please read the following article and generate a JSON response in plain text without any code block delimiters. Use the specified format:"
        },
        {
            "role": "user",
            "content": `
      {
        "newTitle": "An easy to read and interpret title for the article as a string.",
        "summary": "Summarize the following news article in a structured format suitable for a webpage. The summary should include key details such as the title, publication date, source, main points, relevant images (if available), and any notable quotes or statistics. Format the summary in clean HTML, using semantic tags and appropriate styles for readability. If the article includes a main image, incorporate it with an <img> tag and a <figcaption> for the caption. If no image is available, exclude this section. Follow this structure:
Title: Use <h1> for the article title.
Date & Source: Use a <p> tag with a <strong> label for the publication date and source.
Image with Caption: If available, use an <img> tag for the image and include a <figcaption> for the caption.
Introduction: Use a <p> tag to provide a brief overview of the article in 1–2 sentences.
Key Points: Use an ordered list (<ol>) or unordered list (<ul>) to highlight the main points covered in the article.
Notable Quotes or Statistics: Use blockquote (<blockquote>) for important quotes or data.
Conclusion: Use a <p> tag for a brief conclusion or takeaway from the article.
",
        "significance": Array of just numbers in this format: [
        Score for Scale (0-10) : How many people were affected by the event described in the article? Consider the geographical scope and how many individuals or groups were impacted,
        Score for Impact (0-10) : How significant was the effect of the event? Consider the depth of its consequences on society, economy, politics, health, or culture. Is it a major disruption or a subtle shift?,
        Score for Novelty (0-10) : How unique and unexpected is the event? Does it introduce new information, concepts, or perspectives? Is it a rare occurrence or something unprecedented?,
        Score for Positivity (0-10) : How positive or uplifting is the event? Is it a breakthrough, achievement, or resolution that benefits society, or is it a negative event (e.g., disaster, crisis)? ,
        Score for Credibility (0-10) : How trustworthy is the source of the article? Does it come from a reputable news organization or reliable sources?,
        Score for Urgency (0-10) : Is the event time-sensitive? Does it require immediate attention or action? How urgent is its resolution or impact?,
        Score for Diversity of Impact (0-10) : How many different sectors, groups, or communities are affected by the event? Does it have far-reaching consequences across multiple domains (e.g., politics, economy, technology, culture)?,
        Score for Long-Term Significance (0-10) : Will this event likely have lasting consequences over time? How will it shape the future, even if its immediate effects are not as large?,
        Score for Public Engagement (0-10) : How much public attention or discussion is the event generating? Is it a topic of widespread conversation on social media, in public forums, or in expert circles?,
        Score for Sentiment Intensity (0-10) : What is the emotional tone surrounding the event? Does it elicit strong emotions like outrage, hope, fear, or pride? How intense is the emotional reaction from the public?,
        Score for Geopolitical Significance (0-10) : Does the event have any significant implications for international relations, security, or global politics? Does it affect global power dynamics or influence national policies?,
        Score for Contextual Significance (0-10) : How does this event fit within the larger context of current events or historical trends? Is it part of a broader movement, crisis, or development?,
        Score for Economic Impact (0-10) : What are the economic consequences of the event? Consider how it might impact markets, industries, jobs, or individuals in the short or long term.
        ]
      }
        `
        },
        {
            "role": "user",
            "content": "If the article is inaccessible (e.g., says 'Access Denied'), return the following JSON:\n     {\n        'title': 'The title of the article as a string',\n        'summary': null,\n        'significance': []\n      }"
        },
        {
            "role": "user",
            "content": "Ensure the response is plain JSON in text format with no code block delimiters or annotations. Don't include ```json ... ``` in your response."
        },
        {
            "role": "user",
            "content": `Article Title: ${article.title}`
        },
        {
            "role": "user",
            "content": `Article Content: ${truncatedArticle}`
        }
    ]


    let gptResponse = await gptPollinations(prompt);

    // Check if gptRepose is actually json
    try {
        gptResponse = JSON.parse(JSON.stringify(gptResponse))

        if (!gptResponse?.summary![0]) return {
            title: article.title,
            newTitle: null,
            summary: null,
            significance: null
        }

        const response = {
            title: article.title,
            newTitle: gptResponse.newTitle,
            summary: gptResponse.summary,
            significance: [
                {
                    type: "Scale",
                    score: gptResponse.significance[0]
                },
                {
                    type: "Impact",
                    score: gptResponse.significance[1]
                },
                {
                    type: "Novelty",
                    score: gptResponse.significance[2]
                },
                {
                    type: "Positivity",
                    score: gptResponse.significance[3]
                },
                {
                    type: "Credibility",
                    score: gptResponse.significance[4]
                },
                {
                    type: "Urgency",
                    score: gptResponse.significance[5]
                },
                {
                    type: "Diversity of Impact",
                    score: gptResponse.significance[6]
                },
                {
                    type: "Long-Term Significance",
                    score: gptResponse.significance[7]
                },
                {
                    type: "Public Engagement",
                    score: gptResponse.significance[8]
                },
                {
                    type: "Sentiment Intensity",
                    score: gptResponse.significance[9]
                },
                {
                    type: "Geopolitical Significance",
                    score: gptResponse.significance[10]
                },
                {
                    type: "Contextual Significance",
                    score: gptResponse.significance[11]
                },
                {
                    type: "Economic Impact",
                    score: gptResponse.significance[12]
                }
            ]
        }

        return response;
    } catch (e) {
        console.error(`Error parsing GPT response: ${e}`);

        return {
            title: article.title,
            newTitle: null,
            summary: null,
            significance: null
        }

    }

    // function that takes a string and truncates it to a word boundary of given word count
    function truncateStringToTokenCount(str: string, num: number) {
        return str.split(/\s+/).slice(0, num).join(" ");
    }
}
