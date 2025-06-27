import Parser from "rss-parser";
import { PreRssJson } from "./types";

interface Feed {
    name: string;
    rss: string;
}

export const rssToJson = async (feed: Feed): Promise<PreRssJson> => {

    const parser: Parser = new Parser();

    let rssUrl = feed.rss;
    if (rssUrl.match("youtube.com/feeds/videos.xml")) {
        // Filter out shorts from YouTube RSS feeds: https://blog.amen6.com/blog/2025/01/no-shorts-please-hidden-youtube-rss-feed-urls/
        rssUrl = rssUrl.replace("channel_id=UC", "playlist_id=UULF")
    }

    const parsedFeed = await parser.parseURL(rssUrl);

    return {
        title: feed.name,
        link: parsedFeed.link ?? feed.rss,
        feedUrl: feed.rss,
        items: parsedFeed.items.map((item) => {

            if (item.link && item.link.match("youtube.com/watch")) {
                const videoId = item.link.split("v=")[1]?.split("&")[0];
                item.enclosure = {
                    url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    type: "image/jpeg"
                };
            }

            return {
                title: item.title ?? "Unknown",
                link: item.link ?? "Unknown",
                author: item.author ?? null,
                content: item.content ?? null,
                thumbnail: item.enclosure?.url ?? null,
                pubDate: item.pubDate
                    ? !isNaN(new Date(item.pubDate).getTime())
                        ? new Date(item.pubDate).toISOString()
                        : new Date().toISOString()
                    : new Date().toISOString()
            }
        })
    }
}