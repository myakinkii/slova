const { generatePrompt, callChatGpt } = require('./openai/chatgpt')
const { getLangs, getTopics, generateTexts } = require('./openai/chatgpt_f10wd')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

module.exports = {
    get: async (lang, textSize, textType, location, modifier) => {
        if (!OPENAI_API_KEY) return ''
        const prompt = generatePrompt(textSize, textType, location, modifier, lang)
        return  callChatGpt(prompt, OPENAI_API_KEY)
    },
    getAll: async (langs, topics) => {
        if (!OPENAI_API_KEY) return ''
        return  generateTexts(langs || getLangs(), topics || getTopics(), OPENAI_API_KEY)
    }
}