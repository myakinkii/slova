const axios = require('axios')

const GC_API_KEY = process.env.GC_API_KEY

const langMaps = {
    hr: { languageCode: 'sr', name: 'sr-RS-Standard-A' }
}

const callGoogleCloud = async (lang, text) => {

    const payload = {
        input: {
            text: text
        },
        voice: {
            languageCode: lang
        },
        audioConfig: {
            audioEncoding: 'OGG_OPUS'
        }
    }
    if (langMaps[lang]) payload.voice = langMaps[lang]

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GC_API_KEY}`
    const { data } = await axios.post(url, payload, {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    return data.audioContent
}

module.exports = {
    get: callGoogleCloud
}

/*

Based on docs here https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
and available voices here https://cloud.google.com/text-to-speech/docs/voices 
seems like we need some ugly mappings for now...

Also voice types info is here https://cloud.google.com/text-to-speech/docs/voice-types
Journey sounds ok, standard sucks a lot..

*/