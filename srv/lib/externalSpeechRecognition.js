const axios = require('axios')

const GC_API_KEY = process.env.GC_API_KEY
const GC_ACCESS_TOKEN = process.env.GC_ACCESS_TOKEN

const callGoogleCloud = async (lang, input) => {

    const payload = {
        config: {
            languageCode: lang
        },
        audio: {
            content: input
        }
    }

    // https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize
    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GC_API_KEY}`
    const { data } = await axios.post(url, payload, {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${GC_ACCESS_TOKEN}`
        }
    })
    return data.results[0].alternatives[0].transcript
}

module.exports = {
    get: callGoogleCloud
}
