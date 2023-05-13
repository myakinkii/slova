const {parseConllu, prepareWords} = require('./lib/conlluParser')

const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

class ImportService extends BaseService {

    async init() {
        this.on('parseInput', this.parseInput)
        this.on('mergeResults', this.performImport)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        await super.init()
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

    async performImport(req) {
        const { Import } = this.entities
        const data = await cds.read(Import, req.params[0].ID).columns( i => { i.ID, i.sentences (s => { s`.*` } )})
        console.log(data)
        // will do some magic to merge data here
    }

    async parseInput (entity, pars) {
        const IMPORT_POS = ['VERB', 'NOUN', 'PRON', 'ADJ']
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

}

module.exports = { ImportService }