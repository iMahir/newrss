import { get, post } from "axios";
import { config } from "../config";
import { readData, writeData } from "../utils/fs";
import { PostRssJson } from "../utils/rss/types";
import { convertToSlug } from "../utils/slug";

export const saveFeeds = async (feeds: PostRssJson[]) => {
    let updatedIds: number[] = [];
    await Promise.all(feeds.map(async (feed) => {
        const slug = convertToSlug(feed.feedUrl);

        let existingFeed: PostRssJson | null = readData(`data/feeds/${slug}.json`, { parseJSON: true });
        if (existingFeed) {
            existingFeed.items = existingFeed.items || [];

            feed.items = [...feed.items, ...existingFeed.items];
            // Use Map for O(n) deduplication instead of O(n²)
            const uniqueItemsMap = new Map();
            feed.items.forEach(item => {
                if (!uniqueItemsMap.has(item.link)) {
                    uniqueItemsMap.set(item.link, item);
                }
            });
            feed.items = Array.from(uniqueItemsMap.values());
            feed.items = feed.items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
            feed.items = feed.items.slice(0, 50);
        }
        await writeData(`data/feeds/${slug}.json`, feed, { isJSON: true });

        if (existingFeed) {
            const newItems = feed.items.filter((item) => !existingFeed.items.some((oldItem) => oldItem.link === item.link));
            updatedIds.push(...newItems.map(item => feed.id));
        } else {
            updatedIds.push(feed.id);
        }
    }));

    await updateRssJson(updatedIds);
    await updateDB();

};

async function updateDB() {
    try {
        const response = await get(`${config.frontend}/api/feeds/sync`);
        console.log("Database updated");
        return response.data;
    } catch (e) {
        console.log("Error updating the database");
        return null;
    }
}

export async function updateRssJson(ids: number[]) {
    try {
        const feeds = (await get(`${config.frontend}/api/feeds`)).data;

        const updatedFeeds = feeds.map((feed: any) => {
            if (ids.includes(feed.id)) {
                return {
                    ...feed,
                    lastUpdated: new Date().toISOString()
                }
            }
            else {
                return feed;
            }
        });

        await writeData(`data/rss.json`, updatedFeeds, { isJSON: true });
        console.log("Updated RSS JSON");
    }
    catch {
        console.log("Error updating RSS JSON");
    }
}
