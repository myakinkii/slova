const { callChatGpt } = require('./chatgpt')

const generateTexts = async (langCodes, topics, apiKey) => {
    const forms = {
        dialog: 'a dialog',
        story: 'a story with one or more characters',
        article: 'an artile explaining it'
    }
    const formCodes = Object.keys(forms)
    const langNames = langCodes.map( code => langs[code] )

    const all = []
    for (let topic of topics) { // topics one by one in batch of 3 parallel calls per text type
        const result = await Promise.all([
            callChatGpt(generatePromptTopic(topic, forms[formCodes[0]], langNames), apiKey),
            callChatGpt(generatePromptTopic(topic, forms[formCodes[1]], langNames), apiKey),
            callChatGpt(generatePromptTopic(topic, forms[formCodes[2]], langNames), apiKey)
        ])
        // here we have 3 elements containing all langs separated by '---' line
        // we want to get and object with all sentences on new lines except for dialog as it has different structure
        const flush = (form, langCode, input) => {
            all.push({
                form: form,
                lang: langCode,
                topic: topic,
                input: input
            })
        }
        result.forEach( (response, index) => {
            const form = formCodes[index]
            const cleanResponse = response.split("\n").filter( s => s !='' && !s.includes('**'))
            if ( index !=0 ) { // can join texts to split it back by lang separator and then by sentences
                const inputTexts = cleanResponse.join("").split("---").map( l => l.split("."))
                inputTexts.forEach( (input, index) => flush(form, langCodes[index], input))
            } else { // here comes dialog stuff where we look for text separator and then add lang
                let inputLines = []
                let langsCopy = Array.from(langCodes)
                for (let i of cleanResponse){
                    if (i == '---') { // flush
                        flush(form, langsCopy.shift(), inputLines)
                        inputLines = []
                    } else { // accumulate
                        inputLines.push(i)
                    }
                }
                flush(form, langsCopy.shift(), inputLines)
            }
        })
    }
    return all
}

const generateDefinitions = async (langCode, sentences, apiKey) => {
    const all = await Promise.all(sentences.map( s=> {
        return callChatGpt(generatePromptDefinition(langCode, s.words.map (w => w.morphem), s.text), apiKey)
    }))
    return all.map( d => d.split("\n").filter( s => !!s ).join("\n") ).join("\n\n")
}

const langs = {
    en: "English",
    cs: "Czech",
    de: "German",
    el: "Greek",
    hr: "Croatian",
    pl: "Polish",
    ru: "Russian"
}

const getLangs = () => ['en', 'hr', 'ru']

// const getTopics = () => ['Family']
const getTopics = () => topics

const topics = [
'Sport',
'Work and Career',
'Health', 'Hospitals', 'Doctor visit',
'Police and Safety',
'Money and Banks',
'Hobbies and Leisure', 'Ways of Traveling',
'Shopping', 'Food',
'People', 'Emotions', 
'Family', 'My Home',
'Kids', 'School',
'Science', 'Education',
'Space', 'Sky, Sun and Moon',
'Beautiful Colors in World',
'Parks and Forests', 'Seas and Lakes',
'Nature', 'Wild animals', 'Pets',
'Human History',
'Earth and Geography',
'Cities', 'Buildings', 'Sightseeing',
'Cars and Bicycles', 'Public Transport'
]

const generatePromptTopic = (topic, form, langs) => {
    return `Please generate text covering topic '${topic}' using simple lexicon 
    in a form of ${form} in ${langs.join(", ")} with 15-20 sentences for each language. 
    Please use plain text instead of formatting and add one line with three dashes '---' to separate languages.`
}

const generatePromptDefinition = (langCode, words, sentence) => {
    return `Imagine you are a dictionary. Your language is ${langs[langCode]}. 
    Please, define words "${words.join('", "')}" one by one in one sentence each, 
    using simple lexicon in context of the following sentence: '${sentence}'. 
    Please, respond in a form of a dictionary article: "word - definition". 
    Start each definition from a new line, don't capitalize words and use only plain text.
    For example, "to read - to look at and comprehend the meaning of written text".`
    // still it sometimes cannot properly use context regarding the part of speech of a word in a sentence (
}

module.exports = {
    getLangs,
    getTopics,
    generateTexts,
    generateDefinitions
}