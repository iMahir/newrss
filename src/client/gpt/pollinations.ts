import axios from "axios"

export const gptPollinations = async (prompts: any[]) => {

    const response = await axios.post("https://text.pollinations.ai/", {
        messages: prompts,
        model: "openai"
    });

    return response.data;
}