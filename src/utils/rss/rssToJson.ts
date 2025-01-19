import Parser from "rss-parser";
import { PreRssJson } from "./types";

interface Feed {
    name: string;
    rss: string;
}

export const rssToJson = async (feed: Feed): Promise<PreRssJson> => {

    const parser = new Parser();
    const parsedFeed = await parser.parseURL(feed.rss);

    return {
        title: feed.name,
        link: parsedFeed.link ?? feed.rss,
        feedUrl: feed.rss,
        items: parsedFeed.items.map((item) => {
            return {
                title: item.title ?? "Unknown",
                link: item.link ?? "Unknown",
                author: item.author ?? null,
                content: item.content ?? null,
                thumbnail: item.enclosure?.url ?? null,
                pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            }
        })
    }
}