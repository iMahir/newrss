import { fetchNewFeeds } from "./handlers/fetchNewFeeds";
import { getUniqueFeeds } from "./handlers/getUniqueFeeds";
import { handleFeeds } from "./handlers/handleFeeds";
import { parseFeedItems } from "./handlers/parseFeedItems";
import { parseUniqueFeeds } from "./handlers/parseUniqueFeeds";
import { saveFeeds } from "./handlers/saveFeeds";

(async () => {

    const newFeeds = await fetchNewFeeds();

    const uniqueFeeds = getUniqueFeeds(newFeeds);

    let parsedUniqueFeeds = parseUniqueFeeds(uniqueFeeds);

    // ! only keep first 2 items for testing

    /*
    parsedUniqueFeeds = parsedUniqueFeeds.map((feed) => {
        feed.items = feed.items.slice(0, 2);
        return feed;
    });
    */

    await parseFeedItems(parsedUniqueFeeds);

    const feeds = await handleFeeds(parsedUniqueFeeds);

    await saveFeeds(feeds);

    process.exit(0);

})();
