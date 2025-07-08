import { post } from "axios";
import { config } from "../config";
import { readData, writeData } from "../utils/fs";
import { PostRssJson } from "../utils/rss/types";

export const saveFeeds = async (feeds: PostRssJson[]) => {
    let updatedIds: number[] = [];
    await Promise.all(feeds.map(async (feed) => {
        const b64 = btoa(feed.feedUrl);
        const slug = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');

        let existingFeed: PostRssJson | null = readData(`data/feeds/${slug}.json`, { parseJSON: true });
        if (existingFeed) {
            existingFeed.items = existingFeed.items || [];

            feed.items = [...feed.items, ...existingFeed.items];
            feed.items = feed.items.filter((item, index, self) => self.findIndex((t) => t.link === item.link) === index);
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

    await updateDB(updatedIds);

};

async function updateDB(ids: number[]) {
    const update = await post(`${config.frontend}/api/feeds/update`, { ids });

    if (update.status !== 200) {
        console.log("Failed to update database");
    }
    console.log(`Updated ${ids.length} feeds in the database.`);
    return update.data;
}