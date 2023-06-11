const {parseConllu, prepareWords, performMerge } = require('./lib/conlluParser')

const cds = require('@sap/cds')
const { BaseService } = require('./baseService')
const e = require('express')

const IMPORT_POS = process.env.IMPORT_POS?.split(',') || ['VERB', 'NOUN', 'PRON', 'ADJ', 'ADV'] // parts of speech to import

class ImportService extends BaseService {

    async init() {
        this.on('addSentence', this.addSentence)
        this.on('addWord', this.addWord)
        this.on('askHelp', this.askHelp)
        this.on('parseInput', this.parseInput)
        this.on('mergeResults', this.performImport)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        await super.init()
    }

    async addSentence(entity, pars) {
        const { Import } = this.entities
        const ID = pars.ID
        const data = await cds.read(Import.drafts, ID)
        const tokens = data.sent.split(" ")
        await cds.update(Import.drafts,pars.ID).with({
            indx: 1, lemma: tokens[0].toLowerCase(),
            pos_code: '', feats: '',
            text: `${data.text||''}\n` + `# text = ${data.sent}\n`
        })
    }

    async askHelp(entity, pars) {
        const { Import } = this.entities
        const ID = pars.ID
        const data = await cds.read(Import.drafts, ID)
        const stanzaTokens = await this.callExternalParser(data.sent, data.lang_code)
        const conlluTokens = stanzaTokens.map( t => `${t.id||t.index}\t${t.text||t.word}\t${t.lemma}\t${t.upos}\t_\t${t.feats||'_'}` )
        await cds.update(Import.drafts,pars.ID).with({
            sent: '', indx : '', lemma:'',
            text: `${data.text||''}` + `${conlluTokens.join("\n")}\n`
        })
    }

    async addWord(entity, pars) {
        const { Import } = this.entities
        const ID = pars.ID
        const data = await cds.read(Import.drafts, ID)
        const tokens = data.sent.split(" ")
        data.form = tokens[data.indx-1]
        data.feats = data.feats ? data.feats.split("|") : []
        if (data.case_code) data.feats.push(`Case=${data.case_code}`)
        if (data.gender_code) data.feats.push(`Gender=${data.gender_code}`)
        if (data.number_code) data.feats.push(`Number=${data.number_code}`)
        if (data.person_code) data.feats.push(`Person=${data.person_code}`)
        if (data.tense_code) data.feats.push(`Tense=${data.tense_code}`)
        if (data.aspect_code) data.feats.push(`Aspect=${data.aspect_code}`)
        if (data.mood_code) data.feats.push(`Mood=${data.mood_code}`)
        if (data.voice_code) data.feats.push(`Voice=${data.voice_code}`)
        if (data.degree_code) data.feats.push(`Degree=${data.degree_code}`)
        if (data.degree_code) data.feats.push(`VerbForm=${data.verbForm_code}`)
        await cds.update(Import.drafts,pars.ID).with({
            indx: data.indx+1, lemma: tokens[data.indx]?.toLowerCase() || '',
            pos_code: '', feats: '', 
            case_code: '', gender_code: '', number_code: '', person_code: '', tense_code: '', aspect_code: '', mood_code: '', voice_code: '', degree_code: '', verbForm_code: '',
            text: `${data.text||''}` + `${data.indx}\t${data.form}\t${data.lemma}\t${data.pos_code}\t_\t${data.feats.join('|')}\n`
        })
    }

    async parseInput (entity, pars) {
        const { Import } = this.entities
        const ID = pars.ID
        const data = await cds.read(Import, ID)
        const lang = data.lang_code
        const results = parseConllu(lang, data.text)
        let words = IMPORT_POS.reduce( (prev,cur) => {
            return prepareWords(lang, results.words, cur, prev)
        },[])
        words.forEach( w => {
            w.sentences.forEach(s => { s["sent_import_ID"] = ID })
        })
        await cds.update(Import,pars.ID).with({
            words : words,
            sentences : Object.values(results.sentences)
        })
        return { ID:pars.ID }
    }

    async getImportData(importId){
        const { Import } = this.entities

        return cds.read(Import, importId).columns( i => { 
            i.ID, 
            i.words ( w => { 
                w`.*`, 
                w.forms(f => { f`.*` }),
                w.sentences(s => { s`.*` })
            }),
            i.sentences(s => { s`.*`, s.tokens( t => { t`.*` }) })
        })
    }

    async getExistingDataFor(newData){
        const { Slova } = cds.entities("cc.slova.model")
        const existingData = {}
        
        return Promise.all(newData.words.map( w => {
            const { morphem, pos, lang } = w
            const key = `${morphem}_${pos}_${lang}` // we use same key im performMerge
            return new Promise( (resolve,reject) => {
                cds.read(Slova,{ morphem, pos, lang }).columns( w => { 
                    w`.*`, 
                    w.forms(f => { f`.*` }),
                    w.sentences(s => { s.sent_hash })
                }).then( re => { existingData[key]=re; resolve() }, err => { existingData[key]={}; resolve()} )
            })
        })).then( () => existingData)
    }

    async getExistingStatFor(newStat){
        const { Stat } = cds.entities("cc.slova.model")
        const existingStat = {}
        
        return Promise.all(Object.keys(newStat).map( key => {
            // here we assume that statkey = `${pos}_${lang}` in performMerge
            const [pos, lang] = key.split("_")
            return new Promise( (resolve,reject) => {
                cds.read(Stat,{ pos, lang }).then( re => { existingStat[key]=re; resolve() }, err => { existingStat[key]={}; resolve()} )
            })
        })).then( () => existingStat)
    }

    makeQueriesFrom(result){
        const { Slova, Sentences, Stat } = cds.entities("cc.slova.model")
        const queries = []

        Object.values(result.update.words).forEach( upd => {
            const { morphem, pos, lang } = upd
            queries.push( UPDATE(Slova,{ morphem, pos, lang }).with(upd) )
        })

        if (Object.keys(result.insert.sentences).length>0){
            queries.push( INSERT.into(Sentences).entries(Object.values(result.insert.sentences)) )
        }
        if (Object.keys(result.insert.words).length>0){
            queries.push( INSERT.into(Slova).entries(Object.values(result.insert.words)) )
        }

        if (queries.length) {
            queries.push( UPSERT.into(Stat).entries(Object.values(result.stat)) )
        }

        return queries
    }

    async performImport(req) {

        const newData = await this.getImportData(req.params[0].ID)
        const existingData = await this.getExistingDataFor(newData)

        const result = performMerge(newData, existingData)

        const existingStat = await this.getExistingStatFor(result.stat)
        for (let k in existingStat){
            // here we also assume that k is statkey = `${pos}_${lang}` from performMerge
            if (existingStat[k]) {
                result.stat[k].lemmas += existingStat[k].lemmas
                result.stat[k].tokens += existingStat[k].tokens
            }
        }
        // basically this stuff above is insert or update with increment depending on data we merge

        return cds.run(this.makeQueriesFrom(result))
    }

    async getGoogleTranslate(data, req) {
        if (!data || Array.isArray(data)) return
        const { Import } = this.entities
        let lang = await cds.read(Import, data.import_ID).columns('lang_code')
        lang = lang.lang_code
        // const lang = "auto" // or can use auto detection
        const profile = await this.getProfile(req.user.id)
        const userLang = profile.defaultLang_code
        const text = data.text
        if (!text) return
        const googleTranslateBaseUrl = 'https://translate.google.com/'
        data.translation = `${googleTranslateBaseUrl}?text=${encodeURIComponent(text)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
    }

}

module.exports = { ImportService }