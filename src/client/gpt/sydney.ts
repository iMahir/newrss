import { SydneyClient } from "bing-sydney-ai";

export const Sydney = async (prompt: string) => {

    const sydney = new SydneyClient();

    await sydney.startConversation();

    sydney.setSearch(false);

    const response = await sydney.ask(prompt);

    if (!response.text) {
        console.log("[GPT Provider] Sydney returned error");
        return null;
    }

    return response.text;
}