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

    const getExactLink = (html) => {
        const regexGPlus = /<g:plusone .* href="(.+)"><\/g:plusone>/g
        return regexGPlus.exec(html)
    }

    const { data: result } = await axios(pars)
    const exactUrl = getExactLink(result)

    if (exactUrl) return exactUrl[1]

    const regexHref = /<a href="index.php\?show=search_by_id&id=([\w\d%]+)">detaljnije<\/a>/g
    // before we jut picked the first id if there were multuple definitions in result
    // const multipleDefinitions = regexHref.exec(result)
    // return multipleDefinitions && `${hjp}index.php?show=search_by_id&id=${multipleDefinitions[1]}`

    const fetchByIdHref = async (atag) => {
        const url = atag.split('"')[1]
        const { data: result } = await axios({url: hjp + url})
        return getExactLink(result)[1] // this must be found always
    }

    // but now we fetch all the results to look for a link that matches our initial word
    // the trick here relies on a fact that links end with keyword=<word>
    // and this does not contain special symbols like accents that search results do
    const multipleDefinitions = result.match(regexHref)
    const exactLinks = await Promise.all(multipleDefinitions.map(fetchByIdHref))
    const superExact = exactLinks.find( link => link.endsWith(encodeURIComponent(word)))
    // but sometimes even with this we can have more than one match
    // e.g. : moći (I) v. be able, can + moći (II) n. relics, remains
    return superExact || exactLinks[0]
}

module.exports = {
    get: async (morphem) => {
        const suggests = await getSuggests(morphem)
        const word = suggests.find(s => s.toLowerCase() == morphem.toLowerCase() )
        if (!word) return ''
        else return fetchDefinitionUrl(morphem)
    }
}