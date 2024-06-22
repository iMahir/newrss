"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sydney = void 0;
const bing_sydney_ai_1 = require("bing-sydney-ai");
const Sydney = async (prompt) => {
    const sydney = new bing_sydney_ai_1.SydneyClient();
    await sydney.startConversation();
    sydney.setSearch(false);
    const response = await sydney.ask(prompt);
    if (!response.text) {
        console.log("[GPT Provider] Sydney returned error");
        return null;
    }
    return response.text;
};
exports.Sydney = Sydney;
