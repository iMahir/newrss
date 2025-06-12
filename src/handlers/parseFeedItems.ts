import axios from "axios";
import { PreRssJson } from "../utils/rss/types";
import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

import { Cluster } from "puppeteer-cluster";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

import fs from "fs";
const readabilityJsStr = fs.readFileSync(
    require.resolve("@mozilla/readability/Readability.js"),
    { encoding: "utf-8" }
);

export const parseFeedItems = async (feeds: PreRssJson[]) => {

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
                '--no-sandbox',
                '--disable-setuid-sandbox'
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

        try {
            await page.goto(data.itemUrl, { waitUntil: "networkidle2", timeout: 0 });

            const resultArticle: any = await page.evaluate(`
                (function(){
                  ${readabilityJsStr}
                  function executor() {
                  return new Readability({}, document).parse();
                  }
                  return executor();
                }())
              `);

            const content = resultArticle?.content ?? null;

            if (content) {
                console.log("Fetched: ", data.itemUrl);
                const targetItem = feeds.find((feed) => feed.feedUrl === data.feedUrl)?.items.find((item) => item.link === data.itemUrl);
                if (targetItem) targetItem.content = content;
                console.log("Updated: ", data.itemUrl);
            }

        } catch (error: any) {
            if (error.name === 'TimeoutError') {
                console.error('Navigation timed out.');
            } else {
                console.error('Task failed:', error);
            }
        }

    });


    await Promise.all(feeds.map(async (feed) => {
        const feedItems = feed.items;

        for (let i = 0; i < feedItems.length; i++) {
            console.log("Fetching: ", feedItems[i].link);

            const item = feedItems[i];

            if (item.link.includes("youtube.com/watch")) {
                item.content = await youtubeContentGET(item);

            } else {
                const content = await articleContentGET(item);
                if (content) {
                    console.log("Fetched: ", item.link);
                    feedItems[i].content = content;
                }
                else {
                    await cluster.queue({ itemUrl: item.link, feedUrl: feed.feedUrl });
                }
            }

        }
    }));

    await cluster.idle();
    await cluster.close();
};

async function articleContentGET(item: PreRssJson["items"][0]) {
    const get = await axios.get(item.link);
    const pageHtml = get.data;

    const doc = new JSDOM(pageHtml, { virtualConsole: new VirtualConsole() });
    const reader = new Readability(doc.window.document);

    if (!isProbablyReaderable(doc.window.document)) return null;

    const article = reader.parse();
    const content = article?.content ?? article?.textContent ?? null;

    if (content === "") return null;
    else if (content && content.match(/enable\s+javascript/gi)) return null;
    else return content;
}

async function youtubeContentGET(item: PreRssJson["items"][0]) {
    const videoId = item.link.split('v=')[1].split('&')[0]; // Extract video ID from URL

    const res = await axios.get(`https://views4you.com/subtitle-download?id=${videoId}&lang=a.en&ext=txt`)
    const subtitles = res.data;

    if (subtitles && subtitles.length > 0) {
        return subtitles;
    } else {
        return null;
    }
}