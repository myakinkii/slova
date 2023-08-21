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
        this.on('generateText', this.generateTextHandler)
        this.on('createText', this.createTextHandler)
        this.on('toggleSkip', this.skipWordToggleHandler)
        this.on('getDefinition', this.getDefinitionUrl)
        this.before('READ', 'Texts', async (req) => {
            // to ensure anonymous singleton works
            await this.getProfile(req.user.id)
        })
        this.after('READ', 'Slova', this.addDefinition)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        this.after('READ', 'Slova.sentences', this.getGoogleTranslate)
        this.before('READ', 'Users', this.checkCreateProfile)
        await super.init()
    }

    async getDefinitionUrl(req) {
        const { lang, lemma } = req.data
        return this.getDefinition(lang, lemma, req.user.id)
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

    async skipWordToggleHandler(req){
        const { morphem, pos, lang }  = req.params[0]
        const key = {
            user_id : req.user.id,
            slovo_morphem : morphem,
            slovo_lang : lang,
            slovo_pos : pos
        }
        console.log(key)
        const { Skips } = cds.entities("cc.slova.model")
        const del = await cds.delete(Skips).where(key)
        if ( del == 1 ) return false
        await cds.create(Skips).entries(key)
        return true
    }

    async createTextHandler(req, next) {
        if (req.user.id == 'anonymous') throw new Error('FORBIDDEN')
        const profile = await this.getProfile(req.user.id)
        const { Import } = cds.entities("cc.slova.model")
        const ID = cds.utils.uuid()
        const textNameCreated = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date());
        await cds.create(Import).entries({ ID: ID, name: textNameCreated, input: req.data.input, lang_code: profile.defaultLang_code, createdBy: profile.id })
        return { ID: ID }
    }

    async parseTextHandler(req, next) {
        const ID = req.params[0]
        const { Import } = cds.entities("cc.slova.model")
        const data = await cds.read(Import, ID)
        if (req.user.id != data.createdBy) throw new Error('FORBIDDEN')
        if (!data.input) return
        const parts = data.input.split("---") // tearline
        const input = parts[0].split("\n").filter(sent => !!sent)
        // here we also have slow child_process.spawn, but we will leave this guy blocking for now
        const text = await this.importHandler.parseMultiline(input, data.lang_code)
        await cds.update(Import, ID).with({ text })
        const profile = await this.getProfile(req.user.id)
        await this.importHandler.parseInput(ID, profile.pos)
    }

    async generateTextHandler(req, next) {
        const ID = req.params[0]
        const { Import, Users } = cds.entities("cc.slova.model")
        // by default cds waits for all our stuff to finish and then commit
        // but we have a slow network request in between of two db queries
        // and in this case missing commit will block the main thread
        // so we will use this cds.tx() magic to commit before calling chatgpt
        // https://cap.cloud.sap/docs/node.js/cds-tx#srv-tx-fn
        let data, profile
        await cds.tx(async (tx) => {
            data = await tx.read(Import, ID)
            if (req.user.id != data.createdBy) throw new Error('FORBIDDEN')
            profile = await tx.read(Users, { id: req.user.id })
        })
        const chatGptResponse = await this.importHandler.callExternalGenerator(data.lang_code, profile.gptSize, profile.gptType, profile.gptLocation, profile.gptModifier)
        return cds.update(Import, ID).with({ input: chatGptResponse.replaceAll('\n\n', '\n') })
    }

    async syncAndReparseConllu(req, next) {
        const { Import } = cds.entities("cc.slova.model")
        const { token } = req.data
        const importData = await this.importHandler.getImportData(token.importId)
        if (req.user.id != importData.createdBy) throw new Error('FORBIDDEN')
        const text = this.importHandler.mergeAndCreateConllu(token, importData.sentences)
        await cds.update(Import, token.importId).with({ text })
        const profile = await this.getProfile(req.user.id)
        await this.importHandler.parseInput(token.importId, profile.pos)
    }

}

module.exports = { TextsService }