const axios = require('axios');

const gramota = 'https://gramota.ru/'
// we are using this dictionary https://gramota.ru/biblioteka/slovari/bolshoj-tolkovyj-slovar

async function fetchDefinitionUrl(word) {
    const searchUrl = `${gramota}poisk?mode=slovari&dicts[]=42&query=${word}` // dict id=42 is epic!!!

    const pars = {
        method: 'get',
        url: searchUrl
    };

    const { data: result } = await axios(pars)

    const regexHref = /<a href="\/poisk\?query=.+&amp;mode=slovari&amp;dicts\[\]=42"/g
    
    const definitions = result.match(regexHref)

    return definitions?.length ? searchUrl : ''
}

module.exports = {
    get: async (morphem) => {
        return fetchDefinitionUrl(morphem)
    }
}