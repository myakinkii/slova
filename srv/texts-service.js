const cds = require('@sap/cds')
const ImportHandler = require('./lib/importHandler')
const definitionFinder = require('./lib/definitionFinder')

const { BaseService } = require('./baseService')

class TextsService extends BaseService {

    importHandler

    async init() {
        this.importHandler = new ImportHandler(cds)
        this.on('syncToken', this.syncAndReparseConllu)
        this.on('parseText', this.parseTextHandler)
        this.on('createText', this.createTextHandler)
        this.on('getDefinition', this.getDefinitionUrl)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        this.after('READ', 'Slova.sentences', this.getGoogleTranslate)
        this.before('READ', 'Users', this.checkCreateProfile)
        await super.init()
    }

    async getDefinitionUrl(req, next) {
        const {lang, lemma} = req.data
        const profile = await this.getProfile(req.user.id)
        const userLang = profile.id == "anynoumous" ? "auto" : profile.defaultLang_code
        let definitionUrl = await definitionFinder.get(lang, lemma).catch( ()=>{} )
        if (!definitionUrl) return ''
        const googleTranslateBaseUrl = 'https://translate.google.com/translate'
        return `${googleTranslateBaseUrl}?u=${encodeURIComponent(definitionUrl)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
    }

    async getGoogleTranslate(results, req) {
        if (!req.query.SELECT.one) return
        const data = results[0]
        const profile = await this.getProfile(req.user.id)
        const userLang = profile.id == "anynoumous" ? "auto" : profile.defaultLang_code
        const lang = data.lang_code || data.sent.lang_code
        const text = data.text || data.sent.text
        if (!text) return
        const googleTranslateBaseUrl = 'https://translate.google.com/'
        const link = `${googleTranslateBaseUrl}?text=${encodeURIComponent(text)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
        if (data.text) data.translation = link
        else data.sent.translation = link
    }

    async createTextHandler(req,next){
        if (req.user.id == 'anonymous') throw new Error('FORBIDDEN')
        const profile = await this.getProfile(req.user.id)
        const { Import } = cds.entities("cc.slova.model")
        const ID = cds.utils.uuid()
        const textNameCreated = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date());
        await cds.create(Import).entries({ ID: ID, name: textNameCreated, input: req.data.input, lang_code: profile.defaultLang_code, createdBy: profile.id })
        return { ID : ID }
    }

    async parseTextHandler(req,next){
        const ID = req.params[0]
        const { Import } = cds.entities("cc.slova.model")
        const data = await cds.read(Import, ID)
        if (req.user.id != data.createdBy) throw new Error('FORBIDDEN')
        if (!data.input) return
        const input = data.input.split("\n").filter( sent => !!sent )
        const text = await this.importHandler.parseMultiline(input, data.lang_code)
        await cds.update(Import, ID).with({text})
        const profile = await this.getProfile(req.user.id)
        await this.importHandler.parseInput(ID, profile.pos)
    }

    async syncAndReparseConllu(req, next) {
        const { Import } = cds.entities("cc.slova.model")
        const { token } = req.data
        const importData = await this.importHandler.getImportData(token.importId)
        if (req.user.id != importData.createdBy) throw new Error('FORBIDDEN')
        const text = this.importHandler.mergeAndCreateConllu(token, importData.sentences)
        await cds.update(Import, token.importId).with({text})
        const profile = await this.getProfile(req.user.id)
        await this.importHandler.parseInput(token.importId, profile.pos)
    }

}

module.exports = { TextsService }