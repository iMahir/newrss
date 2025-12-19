/*
import { readData, writeData } from "../utils/fs";
import { PostRssJson } from "../utils/rss/types";
import { optimizeStringForGpt } from "./handleFeeds";

import axios from 'axios';
import Bottleneck from 'bottleneck';

interface GptInput {
    prompts: { role: string, content: string }[];
    model?: string;
}

const limiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 500,
});

const rateLimitedAxios = limiter.wrap(
    async (config: { url: string, data?: any, config?: any }) => {
        return axios.post(config.url, config.data, config.config);
    }
);

const gpt = async (input: GptInput): Promise<any> => {
    try {
        const response: any = await rateLimitedAxios({
            url: "https://text.pollinations.ai/",
            data: {
                messages: input.prompts,
                model: input.model ?? "openai"
            }
        });

        return response.data;
    } catch (e: any) {
        console.error(`Error in GPT request: ${e?.status}`);
        return null;
    }
};

export const rssHandler = async (rssFeeds: PostRssJson[]) => {
    let storedRssData: RssData[] = readData("./data/rss.json", { parseJSON: true }) ?? [];

    const allItems = rssFeeds.flatMap((feed) => feed.items)
        .sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());

    allItems.forEach((rssItem) => {
        const existingItem = storedRssData.find((data) => data.sources.find((source) => source.link === rssItem.link));

        if (!existingItem) {
            const matchedRssData = storedRssData.find((data) => matchKeywords(data.keywords, rssItem.keywords));

            if (matchedRssData && !matchedRssData.sources.some((source) => source.link === rssItem.link)) {
                matchedRssData.sources.push({
                    title: rssItem.title,
                    link: rssItem.link
                });

                matchedRssData.keywords = [...new Set([...matchedRssData.keywords, ...rssItem.keywords])].map((keyword) => keyword.toLowerCase());

                matchedRssData.title = rssItem.title + " + " + matchedRssData.title;

                const thumbnails = rssItem.thumbnail ? [rssItem.thumbnail] : [];
                matchedRssData.thumbnails = [...new Set([...matchedRssData.thumbnails, ...thumbnails])];

                matchedRssData.lastUpdated = new Date().toISOString();

                if (matchedRssData.scores && rssItem.scores) {
                    matchedRssData.scores.impact = (matchedRssData.scores.impact + rssItem.scores.impact) / 2;
                    matchedRssData.scores.novelty = (matchedRssData.scores.novelty + rssItem.scores.novelty) / 2;
                    matchedRssData.scores.longTermSignificance = (matchedRssData.scores.longTermSignificance + rssItem.scores.longTermSignificance) / 2;

                    // round scores to 2 decimal places
                    matchedRssData.scores.impact = Math.round(matchedRssData.scores.impact * 100) / 100;
                    matchedRssData.scores.novelty = Math.round(matchedRssData.scores.novelty * 100) / 100;
                    matchedRssData.scores.longTermSignificance = Math.round(matchedRssData.scores.longTermSignificance * 100) / 100;
                }

                matchedRssData.summary += "\n\n" + rssItem.summary;

                matchedRssData.hasBeenUpdated = true;

            } else {
                storedRssData.push({
                    title: rssItem.title,
                    id: generateId(rssItem.title + Date.now().toString()),
                    summary: rssItem.summary,
                    thumbnails: rssItem.thumbnail ? [rssItem.thumbnail] : [],
                    scores: rssItem.scores,
                    keywords: rssItem.keywords,
                    sources: [{
                        title: rssItem.title,
                        link: rssItem.link
                    }],
                    lastUpdated: new Date().toISOString(),
                    hasBeenUpdated: false
                });
            }
        }
    });

    await Promise.all(storedRssData.map(async (rssData) => {
        if (rssData.hasBeenUpdated === true) {
            console.log(`Parsing: ${rssData.title}`);

            const parsedItem = await parseItem(rssData);
            if (parsedItem.title && parsedItem.summary) {
                rssData.title = parsedItem.title;
                rssData.summary = parsedItem.summary;
                if (rssData.keywords?.length > 3) rssData.keywords = parsedItem.keywords;

                console.log(`Parsed: ${rssData.title}`);
            } else {
                storedRssData.splice(storedRssData.indexOf(rssData), 1);
            }
        }

        delete rssData.hasBeenUpdated;
    }));

    storedRssData = storedRssData.filter((rssData) => rssData.summary !== null);
    storedRssData = storedRssData.filter((rssData) => new Date().getTime() - new Date(rssData.lastUpdated).getTime() <= 1000 * 60 * 60 * 24 * 7 * 2);
    storedRssData = storedRssData.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    writeData("./data/rss.json", storedRssData, { isJSON: true });
};

async function parseItem(rssData: RssData) {
    const prompts = [
        {
            role: "system",
            content: "You are a helpful assistant. You specialize in reading and summarizing articles."
        },
        {
            role: "user",
            content: "Please read the following article and generate a JSON response in plain text without any code block delimiters. Use the specified format:"
        },
        {
            role: "user",
            content: JSON.stringify({
                title: "An easy to read and interpret title for the article as a string.",
                summary: `You are an expert summarizer. You will receive either:
- A news article’s HTML, or
- A YouTube video’s subtitle transcript.

Your output must be a single 2–3 sentence summary that:
1. Captures the core message clearly.
2. Highlights the main insight or takeaway.
3. Signals its relevance or why someone should read/watch.

Keep it ultra‑concise, coherent, and polished. No labels, headings, or extra text. Max 50 words.
`,
                keywords: "A list of keywords that best describe the article, as an array of strings. Keep it limited to important, best keywords.",
            })
        },
        {
            role: "user",
            content: "Ensure the response is plain JSON in text format with no code block delimiters or annotations. Don't include ```json ... ``` in your response."
        },
        {
            role: "user",
            content: `Article/Subtitle JSON: ${JSON.stringify(rssData, null, 2)}`
        }
    ]


    const gptResponse = await gpt({
        prompts: prompts.map(prompt => ({ role: prompt.role, content: optimizeStringForGpt(prompt.content) })),
        model: "openai"
    });

    return {
        title: gptResponse?.title ?? null,
        summary: gptResponse?.summary ?? null,
        keywords: gptResponse?.keywords ?? null
    };
}

function matchKeywords(keywords1: string[], keywords2: string[]): boolean {
    if (!keywords1 || !keywords2 || keywords1.length < 3 || keywords2.length < 3) {
        return false;
    }

    let matchingKeywordCount = 0;
    for (let i = 0; i < keywords1.length; i++) {
        if (keywords2.includes(keywords1[i])) {
            matchingKeywordCount++;
        }
    }

    return matchingKeywordCount >= 3;
}

function generateId(input: string): string {
    const cyrb64 = (str: string, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        // For a single 53-bit numeric return value we could return
        // 4294967296 * (2097151 & h2) + (h1 >>> 0);
        // but we instead return the full 64-bit value:
        return [h2 >>> 0, h1 >>> 0];
    };

    const cyrb64Hash = (str: string, seed = 0) => {
        const [h2, h1] = cyrb64(str, seed);
        return h2.toString(36).padStart(7, '0') + h1.toString(36).padStart(7, '0');
    }

    return cyrb64Hash(input);
}

interface RssData {
    title: string;
    id: string;
    thumbnails: (string)[];
    summary: string | null;
    scores: PostRssJson["items"][0]["scores"];
    keywords: PostRssJson["items"][0]["keywords"];
    sources: {
        title: string;
        link: string;
    }[];
    lastUpdated: string;
    hasBeenUpdated?: boolean;
}


*/