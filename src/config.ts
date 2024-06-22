import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

export const readData = (path: string, config: {
    parseJSON?: boolean;
} = {
        parseJSON: false,
    }) => {

    try {

        const data = readFileSync(`./data/${path}`, "utf-8");

        if (config.parseJSON) {
            return JSON.parse(data);
        }

        return data;

    } catch (_) {
        return null;
    }
}

export const writeData = async (path: string, data: string | NodeJS.ArrayBufferView | any, config: {
    isJSON?: boolean;
} = {
        isJSON: false,
    }) => {

    if (config.isJSON) {
        return await writeFile(`./data/${path}`, JSON.stringify(data, null, 2));
    }

    await writeFile(`./data/${path}`, data);
}

export const data = {
    feeds: readData("feeds.json", { parseJSON: true }),
    subscribed: readData("subscribed.json", { parseJSON: true }),
}