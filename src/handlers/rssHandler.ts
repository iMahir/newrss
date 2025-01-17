import { readData, writeData } from "../utils/fs";
import { PostRssJson } from "../utils/rss/types";
import { optimizeStringForGpt } from "./handleFeeds";

import axios from 'axios';
import Bottleneck from 'bottleneck';

interface GptInput {
    prompts: { role: string, content: string }[];
    model?: string;
}

// Configure Bottleneck for rate limiting
const limiter = new Bottleneck({
    maxConcurrent: 20, // Max number of concurrent requests
    minTime: 200, // Minimum time (ms) between requests (5 requests per second)
});


// Wrap Axios with Bottleneck
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
        const existingItem = storedRssData.find((data) => data.sources.some((source) => source.link === rssItem.link));

        if (!existingItem) {
            allItems.forEach((rssItem) => {
                const matchedRssData = storedRssData.find((data) => matchKeywords(data.keywords, rssItem.keywords));

                if (matchedRssData && !matchedRssData.sources.some((source) => source.link === rssItem.link)) {
                    matchedRssData.sources.push({
                        title: rssItem.title,
                        link: rssItem.link
                    });

                    matchedRssData.keywords = [...new Set([...matchedRssData.keywords, ...rssItem.keywords])];

                    matchedRssData.title = rssItem.title + " + " + matchedRssData.title;

                    const thumbnails = rssItem.thumbnail ? [rssItem.thumbnail] : [];
                    matchedRssData.thumbnails = [...new Set([...matchedRssData.thumbnails, ...thumbnails])];

                    matchedRssData.lastEdited = new Date().toISOString();

                    if (matchedRssData.scores && rssItem.scores) {
                        matchedRssData.scores.impact = (matchedRssData.scores.impact + rssItem.scores.impact) / 2;
                        matchedRssData.scores.novelty = (matchedRssData.scores.novelty + rssItem.scores.novelty) / 2;
                        matchedRssData.scores.longTermSignificance = (matchedRssData.scores.longTermSignificance + rssItem.scores.longTermSignificance) / 2;
                    }

                    matchedRssData.summary += "\n\n" + rssItem.summary;

                    matchedRssData.hasBeenUpdated = true;

                } else {
                    storedRssData.push({
                        title: rssItem.title,
                        id: rssItem.link,
                        summary: rssItem.summary,
                        thumbnails: rssItem.thumbnail ? [rssItem.thumbnail] : [],
                        scores: rssItem.scores,
                        keywords: rssItem.keywords,
                        sources: [{
                            title: rssItem.title,
                            link: rssItem.link
                        }],
                        lastEdited: new Date().toISOString(),
                        hasBeenUpdated: false
                    });
                }
            });
        }
    });

    await Promise.all(storedRssData.map(async (rssData) => {
        if (rssData.hasBeenUpdated) {
            const parsedItem = await parseItem(rssData);
            if (parsedItem.title && parsedItem.summary) {
                rssData.title = parsedItem.title;
                rssData.summary = parsedItem.summary;
            } else {
                storedRssData.splice(storedRssData.indexOf(rssData), 1);
            }
        }
    }));

    storedRssData = storedRssData.filter((rssData) => rssData.summary !== null);
    storedRssData = storedRssData.filter((rssData) => new Date().getTime() - new Date(rssData.lastEdited).getTime() <= 1000 * 60 * 60 * 24 * 7 * 2);
    storedRssData = storedRssData.sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());

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
                summary: "Merge the summaries into one."
            })
        },
        {
            role: "user",
            content: "Ensure the response is plain JSON in text format with no code block delimiters or annotations. Don't include ```json ... ``` in your response."
        },
        {
            role: "user",
            content: `Article JSON: ${JSON.stringify(rssData, null, 2)}`
        }
    ]


    const gptResponse = await gpt({
        prompts: prompts.map(prompt => ({ role: prompt.role, content: optimizeStringForGpt(prompt.content) })),
        model: "openai"
    });

    return {
        title: gptResponse?.title ?? null,
        summary: gptResponse?.summary ?? null
    };
}

function matchKeywords(keywords1: string[], keywords2: string[]): boolean {
    let matchingKeywordCount = 0;
    for (let i = 0; i < keywords1.length; i++) {
        if (keywords2.includes(keywords1[i])) {
            matchingKeywordCount++;
        }
    }

    return matchingKeywordCount >= 3;
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
    lastEdited: string;
    hasBeenUpdated: boolean;
}
