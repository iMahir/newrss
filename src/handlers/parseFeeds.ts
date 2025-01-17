import { Cluster } from "puppeteer-cluster";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PreRssJson } from "../utils/rss/types";
puppeteer.use(StealthPlugin());
import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

export const parseFeeds = async (parsedUniqueFeeds: PreRssJson[]) => {

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 5,
        retryLimit: 0,
        puppeteer,
        puppeteerOptions: {
            headless: true,
            args: [
                '--disable-features=SameSiteByDefaultCookies', // Allow third-party cookies
                '--disable-features=CookiesWithoutSameSiteMustBeSecure', // Allow insecure cookies
            ]
        }
    });


    await cluster.task(async ({ page, data }) => {

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        let content = null;

        try {
            await page.goto(data.itemUrl, { waitUntil: "networkidle2", timeout: 1000 * 50 });
            const pageHtml = await page.content();
            content = extractContent(pageHtml);
        } catch (e) {
            console.log(`Error fetching content for URL: ${data.itemUrl}`);
            const pageHtml = await page.content().catch(() => null);
            if (pageHtml) content = extractContent(pageHtml);
        }

        if (content) console.log("Fetched: ", data.itemUrl);

        const targetFeed = parsedUniqueFeeds.find(feed => feed.title === data.feedTitle);
        if (targetFeed) {
            const targetItem = targetFeed.items.find((item) => item.link === data.itemUrl);
            if (targetItem) {
                targetItem.content = content;
                console.log("Updated: ", data.itemUrl);
            }
        }

    });

    parsedUniqueFeeds.forEach((feed) => {
        feed.items.forEach((item) => {
            if (!item.content || !isHtml(item.content)) {
                console.log("Queueing: ", item.link);
                cluster.queue({ itemUrl: item.link, feedTitle: feed.title });
            } else {
                console.log("Skipping: ", item.link);
                item.content = extractContent(item.content);
            }
        });
    });

    await cluster.idle();
    await cluster.close();

    return parsedUniqueFeeds;
}

const extractContent = (pageHtml: string) => {
    const doc = new JSDOM(pageHtml, { virtualConsole: new VirtualConsole() });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    const content = article?.content ?? article?.textContent ?? pageHtml;

    if (content === "") return null;
    else return content;
}

const isHtml = (str: string) => {
    return /<[a-z][\s\S]*>/i.test(str);
}