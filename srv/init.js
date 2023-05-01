var conllu = require('conllu')

const LOG = cds.log('init')

const IMPORT_POS = ['VERB', 'NOUN', 'PRON', 'ADJ']
const CONLLU_SET = 'train'
const LANG = 'hr'

const parseConllu = (lang, set) => {
    c = new conllu.Conllu()
    LOG.debug('parsing conllu set', set)
    c.serial = require('fs').readFileSync(`./test/conllu/${lang}_set-ud-${set}.conllu`, 'utf8')
    const voc = c.sentences.reduce(function (prev, cur) {
        cur.tokens.forEach(function (t) {
            const lemma = t.lemma
            const form = t.form && t.form.toLowerCase()
            if (!lemma || !form) {
                LOG.debug('weird token', t)
                LOG.debug('comments', cur.comments)
                return
            }
            if (!prev[t.upostag]) prev[t.upostag] = { "_": { total: 0, tokens: 0 } }
            if (!prev[t.upostag][lemma]) {
                prev[t.upostag]["_"].total++
                prev[t.upostag][lemma] = { lemma: lemma, forms: new Set(), feats: {}, count: 0 }
            }
            prev[t.upostag][lemma].forms.add(form)
            const feats = t.feats && t.feats.split("|").map(f => { const kv = f.split("="); return { k: kv[0], v: kv[1] } })
            if (feats) prev[t.upostag][lemma].feats[form] = feats.reduce((prev, cur) => {
                prev[cur.k] = cur.v
                return prev
            }, {})
            prev[t.upostag][lemma].count++
            prev[t.upostag]["_"].tokens++
        })
        return prev
    }, {})
    return voc
}

const prepareWords = (lang, src, pos, target) => {
    const data = src[pos]
    const stat = data['_']
    delete data['_']
    LOG.debug('prepare words for', pos)
    LOG.debug(stat)
    for (let w in data) {
        const fraction = (data[w].count / stat.tokens * 100).toFixed(1)
        const word = {
            morphem: w,
            lang: lang,
            pos: pos,
            occurence: `${fraction}% - ${data[w].count} occs of ${stat.tokens} for ${pos} (${stat.total})`,
            count: data[w].count,
            forms: []
        }
        data[w].forms.forEach((form) => {
            word.forms.push(Object.assign({
                form: form
            }, data[w].feats[form]))
        })
        target.push(word)
    }
    return target
}

const getParser = (lang, setName) => {
    const dataSet = parseConllu(lang, setName)
    return (prev, cur) => prepareWords(lang, dataSet, cur, prev)
}

module.exports = (db) => {
    const { Slova, Etymology, Users } = db.entities('ru.dev4hana.slova')
    let words = IMPORT_POS.reduce(getParser(LANG, CONLLU_SET), [])
    words = IMPORT_POS.reduce( getParser('ru', 'test'), words)
    words = IMPORT_POS.reduce( getParser('cu', CONLLU_SET), words)
    LOG.debug('inserting words', words.length)
    const etymology = [
        { root: 'gʰóstis', ascii: 'gostis', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Indo-European/g%CA%B0%C3%B3stis' },
        { root: 'slovo', ascii: 'slovo', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Slavic/slovo' }
    ]
    const users = [{ id: 'alice', defaultLang_code: 'en' }]
    return cds.run([
        INSERT.into(Slova).entries(words),
        INSERT.into(Etymology).entries(etymology),
        INSERT.into(Users).entries(users)
    ])
}
