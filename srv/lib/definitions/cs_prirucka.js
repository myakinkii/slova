const axios = require('axios');

const prirucka = 'https://prirucka.ujc.cas.cz/'

async function fetchDefinitionUrl(word) {

    const searchUrl = `${prirucka}?slovo=${word}`

    const pars = {
        method: 'get',
        url: searchUrl
    };

    const { data: result } = await axios(pars)

    const regexHlavicka = /<div class='hlavicka'><h2 class='ks'><strong>(\p{L}+)<\/strong>/gu
    
    const definitions = result.match(regexHlavicka)

    if (definitions && definitions.length) return searchUrl // got exact match

    const regexHref = new RegExp(`<a href='${prirucka}\\?id=(.+)&amp;dotaz=${word}&amp;ascii=1'>`,'g')
    const multipleDefinitions = result.match(regexHref) // can have multiple definitions with no way to decide
    // https://prirucka.ujc.cas.cz/?id=j%C3%A1&dotaz=ja&ascii=1 <-- this is some weird stuff (id=já)
    // https://prirucka.ujc.cas.cz/?id=j%C3%A1_1&dotaz=ja&ascii=1 <-- this is actually I as pronoun we expect (id=já_1)

    return multipleDefinitions?.length ? searchUrl : ''
}

module.exports = {
    get: async (morphem) => {
        return fetchDefinitionUrl(morphem)
    }
}