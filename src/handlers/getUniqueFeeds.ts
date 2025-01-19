import { readData } from "../utils/fs";
import { PostRssJson, PreRssJson } from "../utils/rss/types";

export const getUniqueFeeds = (newFeeds: PreRssJson[]) => {

    let oldFeeds: (PreRssJson | PostRssJson)[] = [];
    newFeeds.forEach((feed) => {
        const oldFeed: PostRssJson | null = readData(`data/feeds/${feed.title}.json`, { parseJSON: true });
        if (oldFeed) oldFeeds.push(oldFeed);
        else oldFeeds.push({
            title: feed.title,
            link: feed.link,
            feedUrl: feed.feedUrl,
            items: []
        });
    });

    const uniqueFeeds = newFeeds.map((newFeed, i) => {
        const oldFeed = oldFeeds[i];

        const newItems = newFeed.items.filter((newItem) => {
            const oldItem = oldFeed?.items?.find((item) => item.link === newItem.link);
            return oldItem === undefined;
        });

        return {
            ...newFeed,
            items: newItems,
        };
    });

    return uniqueFeeds;
}