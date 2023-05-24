const axios = require('axios');

const callStanza = async (lang, sentence) =>{
    const stanza = 'http://stanza.run/'
    const date = new Date()
    const pars = encodeURI(JSON.stringify({ annotators: "tokenize,ssplit,upos,lemma", date: date.toISOString() }))
    const url = `${stanza}?properties=${pars}&pipelineLanguage=${lang}`
    const { data: result } = await axios.post( url, sentence, {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json, text/javascript',
            'Origin': stanza,
            'Referer': stanza,
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    return result.sentences[0]?.tokens
}

module.exports = {
    get: async (lang, sentence) => {
        return callStanza(lang, sentence)
    }
}