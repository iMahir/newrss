import { get } from "axios";
import { rssToJson } from "../utils/rss/rssToJson";
import { PreRssJson } from "../utils/rss/types";
import { config } from "../config";

export const fetchNewFeeds = async (): Promise<PreRssJson[]> => {
    const feeds = (await get(`${config.frontend}/api/feeds`)).data;

    const newFeeds = await Promise.all(feeds.map(async (feed: { name: string; rss: string; id: number }) => {
        try {
            let rss = await rssToJson(feed);
            if (!rss) return null;

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