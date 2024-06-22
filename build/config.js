"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = exports.writeData = exports.readData = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const readData = (path, config = {
    parseJSON: false,
}) => {
    try {
        const data = (0, fs_1.readFileSync)(`./data/${path}`, "utf-8");
        if (config.parseJSON) {
            return JSON.parse(data);
        }
        return data;
    }
    catch (_) {
        return null;
    }
};
exports.readData = readData;
const writeData = async (path, data, config = {
    isJSON: false,
}) => {
    if (config.isJSON) {
        return await (0, promises_1.writeFile)(`./data/${path}`, JSON.stringify(data, null, 2));
    }
    await (0, promises_1.writeFile)(`./data/${path}`, data);
};
exports.writeData = writeData;
exports.data = {
    feeds: (0, exports.readData)("feeds.json", { parseJSON: true }),
    subscribed: (0, exports.readData)("subscribed.json", { parseJSON: true }),
};
