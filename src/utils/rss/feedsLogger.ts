import { PostRssJson, PreRssJson } from "./types";

export const feedsLogger = (feeds: (PreRssJson | PostRssJson)[], input: keyof typeof feeds[0]['items'][0]) => {

    feeds.forEach((feed) => {

        feed.items.forEach((item) => {

            console.log(item[input]);

        });

    });

}