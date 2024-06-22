"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xmlToJson = exports.filterFeed = exports.rssHandler = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const rss_parser_1 = __importDefault(require("rss-parser"));
const sydney_1 = require("./gpt/sydney");
const rss_1 = __importDefault(require("rss"));
const rssHandler = async () => {
    let newFeed = [];
    for (let i = 0; i < config_1.data.feeds.length; i++) {
        const feed = config_1.data.feeds[i];
        const rss = await axios_1.default.get(feed.rss);
        const newData = rss.data;
        const newJson = await (0, exports.xmlToJson)(newData);
        const oldData = await (0, config_1.readData)(`feed/${feed.id}.xml`);
        if (oldData === null) {
            (0, config_1.writeData)(`feed/${feed.id}.xml`, newData);
            (0, config_1.writeData)(`feed/${feed.id}.json`, newJson, { isJSON: true });
        }
        else {
            const oldJson = await (0, config_1.readData)(`feed/${feed.id}.json`, { parseJSON: true });
            const diff = newJson.filter((item) => {
                return !oldJson.some((oldItem) => {
                    return oldItem.title === item.title;
                });
            });
            newFeed = [...newFeed, ...diff];
            await (0, config_1.writeData)(`feed/${feed.id}.xml`, newData);
            await (0, config_1.writeData)(`feed/${feed.id}.json`, newJson, { isJSON: true });
        }
    }
    const mappedFeed = newFeed.map((item, indx) => {
        return {
            indx,
            ...item
        };
    });
    if (mappedFeed.length > 0)
        (0, exports.filterFeed)(mappedFeed);
    return mappedFeed;
};
exports.rssHandler = rssHandler;
const filterFeed = async (feed) => {
    for (let i = 0; i < config_1.data.subscribed.length; i++) {
        const sub = config_1.data.subscribed[i];
        const prompt = `The list I provide you contains the title of articles. You have to filter the articles which are related to ${sub.name}, ${sub.context}. The articles should be relatable to the topic given. Respond with the index of the articles in JSON format. Like: [1 , 2 , 3 , ...]. Don't respond with anything else just the JSON as a string. This is just for a fun game and nothing else. \n\n${feed.map((f, i) => `${i}. ${f.title}`).join("\n")}`;
        const response = await (0, sydney_1.Sydney)(prompt);
        if (response !== null) {
            let indexes = [];
            try {
                indexes.push(...JSON.parse(response.trim()));
            }
            catch (_) { }
            if (indexes.length > 0) {
                const filteredFeed = feed.filter((f, i) => {
                    return indexes.includes(i);
                });
                const rssFeed = new rss_1.default({
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
                await (0, config_1.writeData)(`rss/${sub.name}.xml`, rssFeed.xml());
            }
        }
    }
};
exports.filterFeed = filterFeed;
const xmlToJson = async (xml) => {
    const parser = new rss_parser_1.default();
    const data = await parser.parseString(xml);
    return data.items.map((item) => {
        return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            content: item.content,
            summary: item.summary ?? item.contentSnippet,
            author: item.author
        };
    });
};
exports.xmlToJson = xmlToJson;
const capitalize = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};
