import { PreRssJson } from "../utils/rss/types";

export const parseUniqueFeeds = (uniqueFeeds: PreRssJson[]) => {

    return uniqueFeeds.map((feed) => {

        const items = feed.items.map((item) => {
            const words = countWords(item.content ?? "");

            return {
                ...item,
                content: words > 300 ? item.content : null
            };
        });

        return {
            ...feed,
            items,
        };
    });

}

const countWords = (text: string) => {
    return text.split(/\s+/).length;
}