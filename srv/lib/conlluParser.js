var conllu = require('conllu')
const crypto = require('crypto')

const performMerge = (newData, existingData) => {
    const insert = { words:{}, sentences:{} }
    const update = { words:{} }
    const stat = {}
    newData.words.forEach( w => {

        const { morphem, pos, lang } = w

        const key = `${morphem}_${pos}_${lang}` // have deps to this key #refactor
        const statkey = `${pos}_${lang}` // have deps to this key #refactor

        if (!stat[statkey]) stat[statkey] = { lang:lang, pos:pos, tokens:0, lemmas:0 }

        const existing = existingData[key] // word we already have

        if (!existing){ // simply add new stuff

            w.sentences.forEach(s => { 
                if (insert.sentences[s.sent_hash]) return // already added now
                const sent = newData.sentences.find( ss => ss.hash==s.sent_hash )
                insert.sentences[s.sent_hash] = {
                    lang_code: lang,
                    hash : sent.hash,
                    text : sent.text,
                    tokens : sent.tokens.map( ({ up__hash, up__import_ID, ...rest}) => rest )
                }
            })

            insert.words[key] = {
                morphem, pos, lang,
                count : w.count, occurence : w.count,
                forms : w.forms.map( ({ lemma_import_ID, ...rest}) => rest ),
                sentences : w.sentences.map( s => ({ sent_hash : s.sent_hash }) )
            }

            stat[statkey].lemmas += 1
            stat[statkey].tokens += w.count

        } else { // figure out what to update

            let skip = true // maybe it is a complete duplicate
            
            w.sentences.forEach(s => { 
                if ( existing.sentences.find( e => e.sent_hash==s.sent_hash)) return // already known before
                const sent = newData.sentences.find( ss => ss.hash==s.sent_hash )
                if (!insert.sentences[sent.hash]) {
                    insert.sentences[sent.hash] = {
                        lang_code: lang,
                        hash : sent.hash,
                        text : sent.text,
                        tokens : sent.tokens.map( ({ up__hash, up__import_ID, ...rest}) => rest )
                    }
                }
                existing.sentences.push({ sent_hash : s.sent_hash}) // also update word
                skip = false
            })

            w.forms.forEach(({ lemma_import_ID, ...f}) => { 
                if ( existing.forms.find( e => e.form==f.form)) return // already known before
                existing.forms.push(f)
                skip = false
            })

            if (skip) return // to avoid incorrectly incrementing stats 

            update.words[key] = {
                morphem, pos, lang,
                count : existing.count + w.count,
                occurence : existing.count + w.count,
                forms : existing.forms,
                sentences : existing.sentences
            }

            stat[statkey].tokens += w.count
        }
    })
    return { insert, update, stat }
}

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
    const voc = c.sentences.reduce(function (prev, cur, index) {
        if (cur.tokens.length==0) return prev
        const comments = cur.comments.reduce( (prev,cur) => {
            const arr = cur.split(" = ")
            prev[arr[0].replace(" ","")] = arr[1]
            return prev
        },{})
        const hash = crypto.createHash('md5').update(comments.text).digest("hex")
        if (!sentences[hash]) {
            sentences[hash] = { 
                hash : hash, 
                index: index,
                lang_code : lang,
                text : comments.text, 
                tokens : cur.tokens.map( (t,i) => {
                    return { 
                        sentence_hash: hash,
                        index: i,
                        lemma: t.lemma,
                        form: t.form,
                        pos: t.upostag,
                        feats: t.feats
                    }
                })
            }
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
                if (cur.k=='Gender[psor]' || cur.k=='Number[psor]'){ // this is hardcore stuff for pronouns
                    return prev // skip it for now
                }
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

module.exports = { parseConllu, prepareWords, performMerge }
