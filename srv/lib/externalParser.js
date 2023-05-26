const axios = require('axios');
const { PythonShell } = require('python-shell');

const LOCAL_STANZA = process.env.LOCAL_STANZA

const callStanzaLocal = async (lang, sentence) => {
    const options = {
        mode: 'text',
        pythonPath: LOCAL_STANZA + '/bin/python',
        scriptPath: __dirname + '/stanza',
        args: [lang, sentence]
    };
    const results = await PythonShell.run('parse.py', options)
    try {
        return JSON.parse(results.join(''))
    } catch (e) {
        return []
    }
}

const callStanza = async (lang, sentence) => {
    const stanza = 'http://stanza.run/'
    const date = new Date()
    const pars = encodeURI(JSON.stringify({ annotators: "tokenize,ssplit,upos,lemma", date: date.toISOString() }))
    const url = `${stanza}?properties=${pars}&pipelineLanguage=${lang}`
    const { data: result } = await axios.post(url, sentence, {
        timeout : 5000,
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
        return LOCAL_STANZA ? callStanzaLocal(lang, sentence) : callStanza(lang, sentence)
    }
}