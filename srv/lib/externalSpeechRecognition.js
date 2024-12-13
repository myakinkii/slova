const axios = require('axios')

const GC_API_KEY = process.env.GC_API_KEY

const callGoogleCloud = async (lang, input) => {

    const payload = {
        config: {
            languageCode: lang,
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: true
        },
        audio: {
            content: input
        }
    }

    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GC_API_KEY}`
    const { data } = await axios.post(url, payload, {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    return data.results.map( r => r.alternatives[0].transcript).join(" ")
}

module.exports = {
    get: callGoogleCloud
}

/*

Based on docs here  https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize

Seemed like we needed both API_KEY and ACCESS_TOKEN

curl --request POST \
  'https://speech.googleapis.com/v1/speech:recognize?key=[YOUR_API_KEY]' \
  --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{}' \
  --compressed

But worked just fine with API_KEY (which makes sense)

https://cloud.google.com/docs/authentication/api-keys-use

Just in case, here's how to get token manually with user authentication to google

https://medium.com/codex/manually-obtain-googleoauth2-access-token-with-your-web-browser-and-curl-fd93effe15ff

*/