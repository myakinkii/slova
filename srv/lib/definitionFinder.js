const langs = {
    hr: require('./definitions/hjp'),
    ru: require('./definitions/gramota')
}

module.exports = {
    get: async (lang, morphem) => {
        if (langs[lang]) return langs[lang].get(morphem)
        return null
    }
}