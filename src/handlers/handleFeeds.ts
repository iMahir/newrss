import axios from 'axios';
import Bottleneck from 'bottleneck';
import { PostRssJson, PreRssJson } from "../utils/rss/types";


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

export const handleFeeds = async (parsedFeeds: PreRssJson[]): Promise<PostRssJson[]> => {

    const feeds = await Promise.all(parsedFeeds.map(async (feed) => {
        const processedItems = await Promise.all(feed.items.map(async (item) => {
            const postRssJsonItem = await generatePostRssJson(item);
            return postRssJsonItem;
        }));

        return {
            ...feed,
            items: processedItems
        };
    }));

    return feeds;
};

const generatePostRssJson = async (preRssJsonItem: PreRssJson['items'][0], retry?: boolean): Promise<PostRssJson["items"][0]> => {
    const prompts = [
        {
            role: "system",
            content: `
You are SummarAI 🔍, the world’s best summarizer.  
• You will receive a single “Content” payload that is either raw HTML or a plain-text transcript.  
• You must output exactly one JSON object, with no surrounding text or fences.  
• If the input is inaccessible or gibberish, output the literal value false (not in quotes).  
• The “summary” field may include Markdown (italics, bold) to highlight key points.  
`
        },
        {
            role: "system",
            content: `
OUTPUT SCHEMA (strict JSON):
{
  "title":      string|null,         // Human‑readable title (≤60 chars)
  "author":     string|null,         // Comma‑separated or null
  "thumbnail":  string|null,         // URL string or null
  "link":       string|null,         // Original URL or null
  "summary":    string,              // Markdown summary (≤ 500 characters), exactly 3 bullet points:
                                     // - sentence 1
                                     // - sentence 2
                                     // - sentence 3
                                     // Emphasize keywords with *italics* or **bold**.
  "scores": {
     "scale":             1–10,      // #affected: geographic+population
     "impact":            1–10,      // severity of consequences
     "novelty":           1–10,      // uniqueness / rarity
     "longTermSignificance": 1–10    // lasting relevance
  },
  "keywords":   string[]            // 3–7 tags
}
`
        },
        {
            role: "user",
            content: `
<<<BEGIN INPUT>>>
Title: ${preRssJsonItem.title || "null"}
Author: ${preRssJsonItem.author || "null"}
Thumbnail: ${preRssJsonItem.thumbnail || "null"}
Link: ${preRssJsonItem.link || "null"}

Content (HTML or transcript):
`
        }
    ];
    // Cache the word split to avoid multiple splits
    const contentWords = preRssJsonItem.content ? preRssJsonItem.content.split(/\s+/) : [];
    const wordCount = contentWords.length;

    if (preRssJsonItem.content && wordCount > 10000 && wordCount < 70000) {

        const chunkSize = 10000;
        const contentChunks = [];
        for (let i = 0; i < contentWords.length; i += chunkSize) {
            contentChunks.push(contentWords.slice(i, i + chunkSize).join(" "));
        }

        contentChunks.forEach((chunk, index) => {
            prompts.push({
                role: "user",
                content: `
<<<BEGIN INPUT CHUNK ${index + 1}>>>
Content Chunk ${index + 1}:
${truncateStringToTokenCount(chunk, 2000)}
<<<END INPUT CHUNK ${index + 1}>>>
`
            });
        });
    }
    else {
        prompts.push({
            role: "user",
            content: `
<<<BEGIN INPUT>>>
Content:
${truncateStringToTokenCount(preRssJsonItem.content || "", 2000)}
<<<END INPUT>>>
`
        });
    }


    console.log(`Summarizing: ${preRssJsonItem.link}`);

    const gptResponse = await gpt({
        prompts: prompts.map(prompt => ({ role: prompt.role, content: optimizeStringForGpt(prompt.content) })),
        model: retry ? "searchgpt" : (preRssJsonItem.content ? "openai" : "searchgpt")
    });

    let postRssJsonItem = {
        title: preRssJsonItem.title,
        link: preRssJsonItem.link,
        author: null,
        thumbnail: null,
        summary: null,
        keywords: [],
        scores: null,
        pubDate: preRssJsonItem.pubDate
    };

    if (!gptResponse) return postRssJsonItem;
    if (gptResponse === false && !retry) return await generatePostRssJson(preRssJsonItem, true);
    if (gptResponse === false && retry) return postRssJsonItem;

    if (gptResponse.summary) console.log(`Summarized: ${preRssJsonItem.link}`);

    return {
        ...postRssJsonItem,
        ...gptResponse,
        author: preRssJsonItem.author ?? gptResponse.author ?? null,
        thumbnail: preRssJsonItem.thumbnail ?? gptResponse.thumbnail ?? null
    };
};

export const gpt = async (input: GptInput): Promise<any> => {
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

function truncateStringToTokenCount(str: string, num: number) {
    return str.split(/\s+/).slice(0, num).join(" ");
}

export function optimizeStringForGpt(str: string) {
    return str.replace(/\s+/g, " ");
}
