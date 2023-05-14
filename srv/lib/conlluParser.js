var conllu = require('conllu')
const crypto = require('crypto')

const prepareWords = (lang, src, pos, target) => {
    const data = src[pos]
    if(!data) return target // no such part of speech in input
    // LOG.debug('prepare words for', pos)
    // LOG.debug(stat)
    for (let w in data) {
        const word = {
            morphem: w,
            lang: lang,
            pos: pos,
            occurence : data[w].tokens, // we will patch it later in handler
            count: data[w].tokens,
            forms: []
        }
        data[w].forms.forEach((form) => {
            word.forms.push(Object.assign({
                form: form
            }, data[w].feats[form]))
        })
        word.sentences = Object.keys(data[w].sentences).map( (hash) => ({ "sent_hash" : hash }) )
        target.push(word)
    }
    return target
}

const parseConllu = (lang, data) => {
    c = new conllu.Conllu()
    // LOG.debug('parsing conllu set', set)
    c.serial = data
    const sentences = {}
    const stat = {}
    const voc = c.sentences.reduce(function (prev, cur) {
        if (cur.tokens.length==0) return prev
        const comments = cur.comments.reduce( (prev,cur) => {
            const arr = cur.split(" = ")
            prev[arr[0].replace(" ","")] = arr[1]
            return prev
        },{})
        const hash = crypto.createHash('md5').update(comments.text).digest("hex")
        if (sentences[hash]) return prev // yes we can have duplicate sentences
        sentences[hash] = { 
            hash : hash, 
            lang_code : lang,
            text : comments.text, 
            tokens : cur.tokens.map( (t,i) => {
                return { 
                    sentence_hash: hash,
                    index: i,
                    lemma: t.lemma,
                    form: t.form,
                    pos: t.upostag
                }
            })
        }
        cur.tokens.forEach(function (t) {
            const lemma = t.lemma
            const form = t.form && t.form.toLowerCase()
            if (!lemma || !form) {
                // LOG.debug('weird token', t)
                // LOG.debug('comments', cur.comments)
                return
            }
            const pos = t.upostag
            if (!prev[pos]) {
                prev[pos]={}
                stat[pos] = { lang: lang, pos: pos, lemmas: 0, tokens: 0 }
            }
            if (!prev[pos][lemma]) {
                stat[pos].lemmas++
                prev[pos][lemma] = { lemma: lemma, forms: new Set(), feats: {}, tokens: 0, sentences:{} }
            }
            prev[pos][lemma].sentences[hash]=true
            prev[pos][lemma].forms.add(form)
            const feats = t.feats && t.feats.split("|").map(f => { const kv = f.split("="); return { k: kv[0], v: kv[1] } })
            if (feats) prev[pos][lemma].feats[form] = feats.reduce((prev, cur) => {
                prev[cur.k] = cur.v
                return prev
            }, {})
            prev[pos][lemma].tokens++
            stat[pos].tokens++
        })
        return prev
    }, {})
    return { words:voc, sentences:sentences, stat:stat }
}

module.exports = { parseConllu, prepareWords }
