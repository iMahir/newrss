import { readData, writeData } from "../utils/fs";
import { PostRssJson } from "../utils/rss/types";

export const saveFeeds = async (feeds: PostRssJson[]) => {
    await Promise.all(feeds.map(async (feed) => {
        let existingFeed: PostRssJson | null = readData(`data/feeds/${feed.title}.json`, { parseJSON: true });
        if (existingFeed) {
            existingFeed.items = existingFeed.items || [];

            feed.items = [...feed.items, ...existingFeed.items];
            feed.items = feed.items.filter((item, index, self) => self.findIndex((t) => t.link === item.link) === index);
            feed.items = feed.items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
            feed.items = feed.items.slice(0, 50);
        }
        await writeData(`data/feeds/${feed.title}.json`, feed, { isJSON: true });
    }));
};
