import { readData } from "../utils/fs";
import { PostRssJson, PreRssJson } from "../utils/rss/types";
import { convertToSlug } from "../utils/slug";

export const getUniqueFeeds = (newFeeds: PreRssJson[]) => {

    let oldFeeds: (PreRssJson | PostRssJson)[] = [];
    newFeeds.forEach((feed) => {
        const slug = convertToSlug(feed.feedUrl);

        const oldFeed: PostRssJson | null = readData(`data/feeds/${slug}.json`, { parseJSON: true });
        if (oldFeed) oldFeeds.push(oldFeed);
        else oldFeeds.push({
            id: feed.id,
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