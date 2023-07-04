const cds = require('@sap/cds')
const ImportHandler = require('./lib/importHandler')

const { BaseService } = require('./baseService')

class ImportService extends BaseService {

    importHandler

    async init() {
        this.importHandler = new ImportHandler(cds)
        this.on('addSentence', this.addSentence)
        this.on('addWord', this.addWord)
        this.on('askHelp', this.askHelpHandler)
        this.on('generateInput', this.generateInputHandler)
        this.on('parseInput', this.parseInputHandler)
        this.on('mergeResults', this.performImportHandler)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        await super.init()
    }

    async generateInputHandler(req, next) {
        const { ID } = req.params[0]
        const { Import } = this.entities
        return this.importHandler.generateInput(ID, Import)
    }

    async askHelpHandler(req, next) {
        const { ID } = req.params[0]
        const { Import } = this.entities
        return this.importHandler.askHelp(ID, Import)
    }

    async parseInputHandler (req, next) {
        const { ID } = req.params[0]
        const { Import } = this.entities
        return this.importHandler.parseInput(ID, Import)
    }

    async performImportHandler(req, next) {
        const {ID} = req.params[0]
        return this.importHandler.performImport(ID)
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