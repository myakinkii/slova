const axios = require('axios');
const { PythonShell } = require('python-shell');

const LOCAL_STANZA = process.env.LOCAL_STANZA

const callStanzaLocal = async (lang, input) => {
    let script
    if (Array.isArray(input)){
        script = 'parseMultiline.py'
    } else {
        script = 'parse.py'
        input = [ input ]
    }
    const options = {
        mode: 'text',
        pythonPath: LOCAL_STANZA + '/bin/python',
        scriptPath: __dirname + '/stanza',
        args: [ lang, input.join("\n\n") ]
    };
    const results = await PythonShell.run(script, options)
    try {
        return JSON.parse(results.join(''))
    } catch (e) {
        return []
    }
}

const callStanza = async (lang, input) => {
    if (Array.isArray(input)) throw new Error('MULTILINE_NOT_SUPPORTED_FOR_REMOTE_STANZA')
    const stanza = 'http://stanza.run/'
    const date = new Date()
    const pars = encodeURI(JSON.stringify({ annotators: "tokenize,ssplit,upos,lemma", date: date.toISOString() }))
    const url = `${stanza}?properties=${pars}&pipelineLanguage=${lang}`
    const { data: result } = await axios.post(url, input, {
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
    get: async (lang, input) => {
        return LOCAL_STANZA ? callStanzaLocal(lang, input) : callStanza(lang, input)
    }
}