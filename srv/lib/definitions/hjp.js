const axios = require('axios');
const FormData = require('form-data');

const hjp = 'https://hjp.znanje.hr/'

async function getSuggests(word) {
    const suggestUrl = `${hjp}hjp_ajax.php?term=${word}`
    const { data: suggests } = await axios({ url: suggestUrl })
    return suggests.map(s => s.label)
}

async function fetchDefinitionUrl(word) {
    const searchUrl = `${hjp}index.php?show=search`
    const data = new FormData();
    data.append('word', word);

    const pars = {
        method: 'post',
        url: searchUrl,
        headers: {
            ...data.getHeaders()
        },
        data: data
    };

    const { data: result } = await axios(pars)
    const regexGPlus = /<g:plusone .* href="(.+)"><\/g:plusone>/g
    const exactUrl = regexGPlus.exec(result)

    if (exactUrl) return exactUrl[1]

    const regexHref = /<a href="index.php\?show=search_by_id&id=([\w\d%]+)">detaljnije<\/a>/g
    const multipleDefinitions = regexHref.exec(result)

    return multipleDefinitions && `${hjp}index.php?show=search_by_id&id=${multipleDefinitions[1]}`
}

module.exports = {
    get: async (morphem) => {
        const suggests = await getSuggests(morphem)
        const word = suggests.find(s => s == morphem)
        if (!word) return ''
        else return fetchDefinitionUrl(word)
    }
}