import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

export const readData = (path: string, config: {
    parseJSON?: boolean;
} = {
        parseJSON: false,
    }) => {

    try {

        const data = readFileSync(`${path}`, "utf-8");

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
        return await writeFile(`${path}`, JSON.stringify(data, null, 2));
    }

    return await writeFile(`${path}`, data);
}