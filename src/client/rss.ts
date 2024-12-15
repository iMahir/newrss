import Parser from "rss-parser";
import { readData, writeData } from "../config";
import axios from "axios";
import RSS from "rss";
import { resolveArticle } from "./resolveArticle";

const fetchRssFeeds = async () => {
    const subscribedFeeds = readData("src/feeds.json", { parseJSON: true });
    return subscribedFeeds;
};

const rssToJson = async (rssUrl: string) => {
    const rss = await axios.get(rssUrl);

    const parser = new Parser();
    const data = await parser.parseString(rss.data);

    return data.items.map((item: any) => {
        return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate
        }
    });
};

export const jsonToRss = async (feed: Feed) => {
    const rssFeed = new RSS({
        title: `${feed.name} Feed`,
        description: `Latest ${feed} articles`,
        feed_url: `https://github.com/iMahir/newrss/data/rss/${feed.name}.xml`,
        site_url: `https://github.com/iMahir/newrss`,
        language: 'en',
        pubDate: new Date().toISOString(),
        ttl: 1000 * 60 * 10,
    });

    feed.data.forEach((item) => {
        rssFeed.item({
            title: item.title,
            description: item.summary ?? `No summary available for this article. Click the link to read more.`,
            url: item.link,
            date: item.pubDate
        });
    });

    return rssFeed.xml({ indent: true });
};


export interface FeedData {
    title: string;
    newTitle?: string;
    link: string;
    pubDate: string;
    summary?: string | null;
    significance?: {
        type: string;
        score: number;
    }[] | null;
}

export interface Feed {
    name: string;
    data: FeedData[]
}


export const rssHandler = async () => {

    const subscribedFeeds = await fetchRssFeeds();

    const feedData: Feed[] = await Promise.all(subscribedFeeds.map(async (feed: any) => {
        return {
            name: feed.name,
            data: await rssToJson(feed.url)
        }
    }));


    const existingFeedData: Feed[] = subscribedFeeds.map((feed: any) => {
        return {
            name: feed.name,
            data: readData(`data/json/${feed.name}.json`, { parseJSON: true }) ?? []
        }
    });


    const newFeedData: Feed[] = feedData.map((feed: Feed) => {
        const existingFeed = existingFeedData.find((existingFeed: Feed) => existingFeed.name === feed.name);
        const newItems = feed.data.filter((item) => !existingFeed?.data.find((existingItem) => existingItem.title === item.title));
        return {
            name: feed.name,
            data: newItems
        }
    });


    let updatedFeed = newFeedData.map((feed: Feed) => {
        const existingFeed = existingFeedData.find((existingFeed: Feed) => existingFeed.name === feed.name);
        const updatedFeed = {
            name: feed.name,
            data: [...feed.data, ...existingFeed?.data ?? []]
        }
        return updatedFeed;
    });

    // sort the feed by date
    updatedFeed = updatedFeed.map((feed: Feed) => {
        feed.data.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        return feed;
    });

    // filter articles with same link by keeping articles with summary
    updatedFeed = updatedFeed.map((feed: Feed) => {
        feed.data = feed.data.filter((item, index, self) => {
            const hasSummary = self.find((t) => t.title === item.title && t.summary !== undefined);
            return hasSummary ? self.findIndex((t) => t.title === item.title) === index : true;
        });
        return feed;
    });

    // filter articles with same title
    updatedFeed = updatedFeed.map((feed: Feed) => {
        feed.data = feed.data.filter((item, index, self) => self.findIndex((t) => t.title === item.title) === index);
        return feed;
    });

    // only keep the latest 30 articles
    updatedFeed = updatedFeed.map((feed: Feed) => {
        feed.data = feed.data.slice(0, 30);
        return feed;
    });


    for (let i = 0; i < updatedFeed.length; i++) {

        let targetFeed = updatedFeed[i];

        const articlesWithoutSummary = targetFeed.data.filter((article) => article.summary === undefined);

        console.log(`Articles without summary for ${targetFeed.name} feed: ${articlesWithoutSummary.length}`);
        console.log(`Resolving article for ${targetFeed.name} feed`);

        const resolvedFeed = await resolveArticle({ name: targetFeed.name, data: articlesWithoutSummary });
        console.log(`Resolved article for ${resolvedFeed.name} feed`);

        targetFeed = {
            name: resolvedFeed.name,
            data: [...resolvedFeed.data, ...targetFeed.data]
        }

        // filter articles with same link or title by keeping articles with summary
        targetFeed.data = targetFeed.data.filter((item, index, self) => {
            const hasSummary = self.find((t) => t.title === item.title && t.summary !== undefined);
            return hasSummary ? self.findIndex((t) => t.title === item.title) === index : true;
        });

        targetFeed.data.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        targetFeed.data = targetFeed.data.slice(0, 30);

        writeData(`data/json/${targetFeed.name}.json`, targetFeed.data, { isJSON: true });

        const rssFeed = await jsonToRss(targetFeed);
        writeData(`data/rss/${targetFeed.name}.xml`, rssFeed);

    }

}