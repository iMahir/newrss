import { readData } from "../utils/fs"
import { rssToJson } from "../utils/rss/rssToJson";
import { PreRssJson } from "../utils/rss/types";

export const fetchNewFeeds = async (): Promise<PreRssJson[]> => {
    const feeds = readData("src/feeds.json", { parseJSON: true });

    const newFeeds = await Promise.all(feeds.map(async (feed: { name: string; rss: string }) => {
        try {
            let rss = await rssToJson(feed);

            // Only keep items from the last four weeks
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - (7 * 4));
            rss.items = rss.items.filter((item) => new Date(item.pubDate) > twoWeeksAgo);

            return rss;
        } catch (e) {
            console.error(e);
            return null;
        }
    }));

    return newFeeds.filter((feed) => feed !== null);
}