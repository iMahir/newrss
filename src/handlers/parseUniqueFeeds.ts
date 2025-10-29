import { PreRssJson } from "../utils/rss/types";

export const parseUniqueFeeds = (uniqueFeeds: PreRssJson[]) => {

    return uniqueFeeds.map((feed) => {

        const items = feed.items.map((item) => {
            // Cache the split result to avoid multiple splits
            const contentWords = item.content ? item.content.split(/\s+/) : [];
            const wordCount = contentWords.length;

            return {
                ...item,
                content: wordCount > 300 ? item.content : null
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