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
            content: "You are a helpful assistant. You specialize in reading and summarizing text."
        },
        {
            role: "user",
            content: "Please read the following article and generate a JSON response in plain text without any code block delimiters. Use the specified format:"
        },
        {
            role: "user",
            content: JSON.stringify({
                title: "An easy to read and interpret title for the article as a string.",
                author: "The authors of the article as a string, separated by commas. Keep it as null if the authors are not mentioned.",
                thumbnail: "A URL to a thumbnail image for the article as a string. If no thumbnail is available, use null.",
                summary: `You are an expert summarizer. You will receive either:
- A news article’s HTML, or
- A YouTube video’s subtitle transcript.

Your output must be a **single 2–3 sentence summary** that:
1. Captures the **core message** clearly.
2. Highlights the main **insight or takeaway**.
3. Signals its **relevance** or why someone should read/watch.

Keep it ultra‑concise, coherent, and polished. No labels, headings, or extra text. Max 50 words.
`,
                scores: "Scores is an object with four keys: scale, impact, novelty, and longTermSignificance." + "\n\n" + [
                    "scale: The scale of the article as a number from 1 to 10, where 1 is the lowest and 10 is the highest. How many people were affected by the event described in the article? Consider the geographical scope and how many individuals or groups were impacted.",
                    "impact: The impact of the article as a number from 1 to 10, where 1 is the lowest and 10 is the highest. How significant was the event described in the article? Consider the consequences and repercussions of the event.",
                    "novelty: The novelty of the article as a number from 1 to 10, where 1 is the lowest and 10 is the highest. How unique or original was the event described in the article? Consider how rare or unusual the event was.",
                    "longTermSignificance: The long-term significance of the article as a number from 1 to 10, where 1 is the lowest and 10 is the highest. How enduring or lasting will the event described in the article be? Consider the lasting impact and implications of the event."
                ].join("\n"),
                keywords: "A list of keywords that best describe the article, as an array of strings. Include terms that are relevant to the content and context of the article.",
            })
        },
        {
            role: "user",
            content: "If the article is inaccessible (e.g., says 'Access Denied'), respond with false only. Do not include any other information in your response."
        },
        {
            role: "user",
            content: "Ensure the response is plain JSON in text format with no code block delimiters or annotations. Don't include ```json ... ``` in your response."
        },
        {
            role: "user",
            content: `Article/Youtube Title: ${preRssJsonItem.title}`
        },
        {
            role: "user",
            content: `Article/Youtube Author: ${preRssJsonItem.author ?? "Not given, get from the article content."}`
        },
        {
            role: "user",
            content: `Article/Youtube Link: ${preRssJsonItem.link}`
        },
        {
            role: "user",
            content: `Article/Youtube Content: ${truncateStringToTokenCount(preRssJsonItem.content ?? "Not given. Get the article content from the provided link.", 2000)}`
        }
    ]

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
