const cds = require('@sap/cds')
const ImportHandler = require('./lib/importHandler')
const definitionFinder = require('./lib/definitionFinder')

const { BaseService } = require('./baseService')

class TextsService extends BaseService {

    importHandler

    async init() {
        this.importHandler = new ImportHandler(cds)
        this.on('syncToken', this.syncAndReparseConllu)
        this.on('getDefinition', this.getDefinitionUrl)
        await super.init()
    }

    async getDefinitionUrl(req, next) {
        const {lang, lemma} = req.data
        // const profile = await this.getProfile(req.user.id)
        const userLang = "auto" //profile.defaultLang_code
        let definitionUrl = await definitionFinder.get(lang, lemma).catch( ()=>{} )
        if (!definitionUrl) return ''
        const googleTranslateBaseUrl = 'https://translate.google.com/translate'
        return `${googleTranslateBaseUrl}?u=${encodeURIComponent(definitionUrl)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
    }

    async syncAndReparseConllu(req, next) {
        const { Import } = cds.entities("cc.slova.model")
        const { token } = req.data
        const importData = await this.importHandler.getImportData(token.importId)
        const text = this.importHandler.mergeAndCreateConllu(token, importData.sentences)
        await cds.update(Import, token.importId).with({text})
        await this.importHandler.parseInput(token.importId, Import)
    }

}

module.exports = { TextsService }