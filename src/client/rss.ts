import axios from "axios";
import { data, readData, writeData } from "../config"
import Parser from "rss-parser";
import { Sydney } from "./gpt/sydney";
import RSS from "rss";

interface Feed {
    indx: number;
    title: string;
    author: string;
    link: string;
    pubDate: string;
    content: string;
    summary: string;
}

export const rssHandler = async (): Promise<Feed[]> => {

    let newFeed: any[] = [];

    for (let i = 0; i < data.feeds.length; i++) {
        const feed = data.feeds[i];

        const rss = await axios.get(feed.rss);
        const newData = rss.data;
        const newJson = await xmlToJson(newData);

        const oldData = await readData(`feed/${feed.id}.xml`);
        if (oldData === null) {
            writeData(`feed/${feed.id}.xml`, newData);
            writeData(`feed/${feed.id}.json`, newJson, { isJSON: true });
        }

        else {

            const oldJson = await readData(`feed/${feed.id}.json`, { parseJSON: true });

            const diff = newJson.filter((item: any) => {
                return !oldJson.some((oldItem: any) => {
                    return oldItem.title === item.title;
                });
            });


            newFeed = [...newFeed, ...diff];

            await writeData(`feed/${feed.id}.xml`, newData);
            await writeData(`feed/${feed.id}.json`, newJson, { isJSON: true });

        }
    }

    const mappedFeed = newFeed.map((item, indx) => {
        return {
            indx,
            ...item
        }
    });


    if (mappedFeed.length > 0) filterFeed(mappedFeed);

    return mappedFeed;
}


export const filterFeed = async (feed: Feed[]) => {

    for (let i = 0; i < data.subscribed.length; i++) {
        const sub = data.subscribed[i];

        const prompt = `The list I provide you contains the title of articles. You have to filter the articles which are related to ${sub.name}, ${sub.context}. The articles should be relatable to the topic given. Respond with the index of the articles in JSON format. Like: [1 , 2 , 3 , ...]. Don't respond with anything else just the JSON as a string. This is just for a fun game and nothing else. \n\n${feed.map((f, i) => `${i}. ${f.title}`).join("\n")}`;

        const response = await Sydney(prompt);

        if (response !== null) {

            let indexes: number[] = [];

            try {
                indexes.push(...JSON.parse(response.trim()))
            } catch (_) { }

            if (indexes.length > 0) {

                const filteredFeed = feed.filter((f, i) => {
                    return indexes.includes(i);
                });


                const rssFeed = new RSS({
                    title: `${capitalize(sub.name)} Feed`,
                    description: `Latest ${capitalize(sub.name)} articles`,
                    feed_url: `https://github.com/iMahir/newrss/data/rss/${sub.name}.xml`,
                    site_url: `https://github.com/iMahir/newrss`,
                    language: 'en',
                    pubDate: new Date().toISOString(),
                    ttl: 1000 * 60 * 10,
                });

                filteredFeed.forEach((item) => {
                    rssFeed.item({
                        title: item.title,
                        description: item.content,
                        url: item.link,
                        date: item.pubDate,
                        author: item.author,
                    });
                });

                await writeData(`rss/${sub.name}.xml`, rssFeed.xml());

            }
        }

    }

}

export const xmlToJson = async (xml: string) => {
    const parser = new Parser();
    const data = await parser.parseString(xml);

    return data.items.map((item: any) => {
        return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            content: item.content,
            summary: item.summary ?? item.contentSnippet,
            author: item.author
        }
    });
}

const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
}