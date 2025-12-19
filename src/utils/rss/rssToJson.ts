import Parser from "rss-parser";
import { PreRssJson } from "./types";
import { get } from "axios";

interface Feed {
    name: string;
    rss: string;
    id: number;
}

export const rssToJson = async (feed: Feed): Promise<PreRssJson | null> => {

    const parser: Parser = new Parser({
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
    });

    let rssUrl = feed.rss;
    if (rssUrl.includes("youtube.com/feeds/videos.xml")) {
        // Filter out shorts from YouTube RSS feeds: https://blog.amen6.com/blog/2025/01/no-shorts-please-hidden-youtube-rss-feed-urls/
        rssUrl = rssUrl.replace("channel_id=UC", "playlist_id=UULF")
    }

    let parsedFeed = await parser.parseURL(rssUrl).catch(() => null);

    if (!parsedFeed) {
        const response = await get(feed.rss).catch(() => null);
        if (response && response.data) {
            parsedFeed = await parser.parseString(response.data).catch(() => null);
        }
    }

    if (!parsedFeed) {
        console.error(`Failed to fetch RSS feed: ${feed.name} (${feed.rss})`);
        return null;
    }

    console.log(`Fetched RSS feed: ${feed.name} (${feed.rss}) with ${parsedFeed.items.length} items.`);

    return {
        id: feed.id,
        title: feed.name,
        link: parsedFeed.link ?? feed.rss,
        feedUrl: feed.rss,
        items: parsedFeed.items.map((item) => {

            if (item.link && item.link.includes("youtube.com/watch")) {
                const videoId = item.link.split("v=")[1]?.split("&")[0];
                item.enclosure = {
                    url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
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
