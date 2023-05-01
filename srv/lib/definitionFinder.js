const langs = {
    hr: require('./definitions/hjp')
}

module.exports = {
    get: async (lang, morphem) => {
        if (langs[lang]) return langs[lang].get(morphem)
        return null
    }
}