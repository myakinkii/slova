const { Configuration, OpenAIApi } = require("openai")

const LOG = cds.log('gpt')

const callChatGpt = async (prompt, apiKey) => {
    const configuration = new Configuration({ apiKey })
    const openai = new OpenAIApi(configuration);
    LOG.debug("Asking to generate prompt:", prompt)
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        })
        return completion.data.choices[0].message.content
    } catch (error) {
        if (error.response) {
            LOG.error("Something went wrong", error.response?.status, error.response?.data?.error?.code);
            return error.response?.data?.error?.message
        } else {
            LOG.error("Error with OpenAI API request", error.message);
            return ''
        }
    }
}

const sizes = {
    small : "around ten sentences long",
    medium : "size of between fifteen and twenty five sentences",
    large : "longer than twenty five sentences"
}

const types = {
    text: "a text",
    story: "a story",
    dialog: "a dialog",
    monologue: "a philospophical monologue",
    news: "a newspaper article"
}

const locations = {
    shop: "in a shop",
    restaurant: "in restaurant",
    hospital: "in hospital",
    airplane: "on board of an airplane",
    taxi: "in taxi",
    office: "in office",
    interview: "during the job interview",
    forest: "in the forest",
    island: "on a desert island",
    hotel: "in a hotel",
    space: "in space"
}

const langs = {
    en: "Simple English",
    de: "German",
    el: "Greek",
    hr: "Croatian",
    pl: "Polish",
    ru: "Russian"
}

const generatePrompt = (textSize, textType, location, modifier, lang) => {
    return `Please generate ${types[textType]} ${sizes[textSize]}, describing ${modifier} situation ${locations[location]}, and then translate it into ${langs[lang]}`
}

module.exports = {
    generatePrompt,
    callChatGpt
}