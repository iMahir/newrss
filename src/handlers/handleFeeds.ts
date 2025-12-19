import axios from "axios";
import Bottleneck from "bottleneck";
import { PreRssJson, PostRssJson } from "../utils/rss/types";

const MODEL = "openai";
const MAX_CHUNK_CHARS = 6000;
const CHUNK_OVERLAP = 400;

const limiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 1500,
});

export const handleFeeds = async (
  parsedFeeds: PreRssJson[]
): Promise<PostRssJson[]> => {
  const result: PostRssJson[] = [];

  for (const feed of parsedFeeds) {
    const items: PostRssJson["items"] = [];

    for (const item of feed.items) {
      items.push(await generatePostRssJson(item));
    }

    result.push({ ...feed, items });
  }

  return result;
};

async function generatePostRssJson(
  item: PreRssJson["items"][0]
): Promise<PostRssJson["items"][0]> {
  if (!item.content) return emptyResult(item);

  const cleanText = sanitizeHtml(item.content);
  const chunks = splitWithOverlap(cleanText, MAX_CHUNK_CHARS, CHUNK_OVERLAP);

  const partialSummaries: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Summarizing chunk ${i + 1}/${chunks.length}`);
    const res = await summarizeChunk(chunks[i], i + 1, chunks.length);
    if (res?.summary) partialSummaries.push(res.summary);
  }

  if (!partialSummaries.length) return emptyResult(item);

  const final = await mergeSummaries(partialSummaries, item);
  if (!final) return emptyResult(item);

  return {
    ...final,
    author: item.author ?? final.author ?? null,
    thumbnail: item.thumbnail ?? final.thumbnail ?? null,
    link: item.link,
    pubDate: item.pubDate,
  };
}

async function summarizeChunk(
  text: string,
  index: number,
  total: number
): Promise<{ summary: string } | null> {
  return callGptJson(
    [
      {
        role: "system",
        content: `
You are SummarAI.
Extract only novel, non-repetitive information.
Write a concise factual summary (≤${MAX_CHUNK_CHARS / (total + 1)} characters).

Return STRICT JSON only:
{ "summary": string }
        `.trim(),
      },
      {
        role: "user",
        content: `Chunk ${index} of ${total}:\n\n${text}`,
      },
    ]
  );
}

async function mergeSummaries(
  summaries: string[],
  item: PreRssJson["items"][0]
): Promise<any | null> {
  return callGptJson(
    [
      {
        role: "system",
        content: `
You are SummarAI 🔍

Return EXACTLY one JSON object.
No explanations. No markdown.

If input is gibberish, return false.

Schema:
{
  "title": string|null,
  "author": string|null,
  "thumbnail": string|null,
  "link": string|null,
  "summary": string,   // EXACTLY 3 bullet points, ≤500 chars
  "scores": {
    "scale": 1-10,
    "impact": 1-10,
    "novelty": 1-10,
    "longTermSignificance": 1-10
  },
  "keywords": string[]
}
        `.trim(),
      },
      {
        role: "user",
        content: `
Title: ${item.title || "null"}
Author: ${item.author || "null"}
Link: ${item.link || "null"}

Partial summaries:
${summaries.map((s, i) => `(${i + 1}) ${s}`).join("\n")}
        `.trim(),
      },
    ]
  );
}

async function callGptJson(
  messages: { role: string; content: string }[]
): Promise<any | null> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await limiter.schedule(() =>
        axios.post("https://text.pollinations.ai/", {
          messages: messages.map(m => ({
            role: m.role,
            content: normalize(m.content),
          })),
          model: MODEL,
        })
      );

      return parseLLMJson(response.data);
    } catch (e: any) {
      const is429 =
        e?.response?.status === 429 ||
        String(e?.response?.data?.error || "").includes("Queue");

      if (is429) {
        await sleep(1500 * Math.pow(2, attempt));
        continue;
      }

      console.error("GPT error:", e?.response?.data || e.message);
      return null;
    }
  }

  return null;
}

export function parseLLMJson(raw: any): any | null {
  if (raw === false) return false;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw);
  } catch { }

  let text = normalizeJsonText(raw);

  const extracted = extractJsonBlock(text);
  if (!extracted) return null;

  try {
    return JSON.parse(repairJson(extracted));
  } catch { }

  try {
    const aggressive = extracted
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
      .replace(/'/g, '"');
    return JSON.parse(repairJson(aggressive));
  } catch {
    console.error("Unrecoverable JSON from model");
    return null;
  }
}

function normalizeJsonText(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\r/g, "")
    .trim();
}

function extractJsonBlock(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function repairJson(text: string): string {
  return text
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/\n/g, "\\n");
}

function splitWithOverlap(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/p>|<\/li>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(str: string) {
  return str.replace(/\s+/g, " ").trim();
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function emptyResult(item: PreRssJson["items"][0]) {
  return {
    title: item.title,
    link: item.link,
    author: item.author ?? null,
    thumbnail: item.thumbnail ?? null,
    summary: null,
    keywords: [],
    scores: null,
    pubDate: item.pubDate,
  };
}
