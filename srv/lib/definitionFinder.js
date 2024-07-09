const langs = {
    cs: require('./definitions/cs_prirucka'),
    hr: require('./definitions/hr_hjp'),
    ru: require('./definitions/ru_gramota')
}

module.exports = {
    get: async (lang, morphem) => {
        if (langs[lang]) return langs[lang].get(morphem)
        return null
    }
}