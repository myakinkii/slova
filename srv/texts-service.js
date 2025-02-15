const cds = require('@sap/cds')
const ImportHandler = require('./lib/importHandler')
const speechRecognition = require('./lib/externalSpeechRecognition')
const speechGenerator = require('./lib/externalSpeechGenerator')
const pdfGenerator = require('./lib/pdf/generator')

const { BaseService } = require('./baseService')

class TextsService extends BaseService {

    importHandler

    async init() {
        this.importHandler = new ImportHandler(cds)
        this.on('syncToken', this.syncAndReparseConllu)
        this.on('resolveDeckFilter', this.resolveDeckHandler)
        this.on('createDeck', this.createDeckHandler)
        this.on('addToParent', this.addToParentHandler)
        this.on('addToDeck', this.addToDeckHandler)
        this.on('mergeToText', this.mergeToTextHandler)
        this.on('speechToText', this.speechToTextHandler)
        this.on('textToSpeech', this.textToSpeechHandler)
        this.on('addSpeechToInput', this.addSpeechToInputHandler)
        this.on('getGoogleTranslateLink', this.getGoogleTranslateLinkHandler)
        this.on('parseText', this.parseTextHandler)
        this.on('generateDefinition', this.generateDefinitionHandler)
        this.on('generateText', this.generateTextHandler)
        this.on('createText', this.createTextHandler)
        this.on('printWords', this.printWordsHandler)
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

    async createDeckHandler(req) {
        if (req.user.id == 'anonymous') throw new Error('FORBIDDEN')
        const { Decks } = cds.entities("cc.slova.model")
        const ID = cds.utils.uuid()
        const name = req.data.name
        return cds.create(Decks).entries({ ID: ID, name: name })
    }

    async resolveDeckHandler(req) {
        const deckId = req.data.deck
        const { Decks } = cds.entities("cc.slova.model")

        let results = {}

        const recursiveRead = async (ID) => {
            const deck = await cds.read(Decks, { ID }).columns(d => {
                d.texts(t => { t`.*` }),
                    d.decks(c => { c`.*` })
            })

            if (!deck) return Promise.resolve()

            if (deck.texts.length) {
                deck.texts.forEach(t => results[t.text_ID] = true)
            }

            if (deck.decks.length) {
                return Promise.all(deck.decks.map(child => recursiveRead(child.deck_ID)))
            }

            return Promise.resolve()
        }

        await recursiveRead(deckId)
        return { ids: Object.keys(results) }
    }

    async addToParentHandler(req) {
        const ID = req.params[0]
        const deckId = req.data.deck
        const { Decks } = cds.entities("cc.slova.model")
        if (ID == deckId) throw new Error('FORBIDDEN')
        return cds.create(Decks.elements.decks.target).entries({
            up__ID: deckId,
            deck_ID: ID
        })
    }

    async addToDeckHandler(req) {
        const ID = req.params[0]
        const deckId = req.data.deck
        const { Decks } = cds.entities("cc.slova.model")
        return cds.create(Decks.elements.texts.target).entries({
            up__ID: deckId,
            text_ID: ID
        })
    }

    async mergeToTextHandler(req) {
        const ID = req.params[0]
        const targetId = req.data.text
        if (targetId == ID) throw new Error('FORBIDDEN')
        const { Import: Texts } = cds.entities("cc.slova.model")
        const source = await cds.read(Texts, { ID })
        const target = await cds.read(Texts, { ID: targetId })
        await cds.update(Texts, { ID: targetId }).with({ input: target.input + '\n' + source.input })
        if (source.status != 9) await cds.delete(Texts, { ID }) // delete unpublished import
        return { ID }
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

    async createTextHandler(req, next) {
        if (req.user.id == 'anonymous') throw new Error('FORBIDDEN')
        const profile = await this.getProfile(req.user.id)
        const { Import } = cds.entities("cc.slova.model")
        const ID = cds.utils.uuid()
        const textNameCreated = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date());
        await cds.create(Import).entries({ ID: ID, name: textNameCreated, input: req.data.input, lang_code: profile.defaultLang_code, createdBy: profile.id })
        return { ID: ID }
    }

    async printWordsHandler(req, next) {
        const { ID, morphem, pos, tier } = req.data
        // const { ImportWords } = cds.entities("cc.slova.model")
        const { Slova } = cds.entities("TextsService")
        const q = cds.read(Slova).columns(w => {
            w.morphem,
            w.lang,
            w.pos,
            w.tier,
            w.sentences(sc => { sc.sent(s => s.text) })
        }).where({ import_ID: ID })
        if (morphem) q.where({ morphem })
        if (pos) q.where({ pos })
        if (tier) q.where({ tier })
        const words = await q.then(res => res.map(w => {
            w.text = w.sentences[0].sent.text
            delete w.sentences
            return w
        }))
        if (!words.length) return pdfGenerator.getEmptyPdf()
        await this.importHandler.callExternalDefinitionsGeneratorForPrint(words) // just modify words with def property
        const cardsPdf = await pdfGenerator.makeCardsFor(words)
        return cardsPdf
    }

    async textToSpeechHandler(req, next) {
        const ID = req.params[0]
        const { Import } = cds.entities("cc.slova.model")
        const data = await cds.read(Import, ID).columns('lang_code')
        const speech = await speechGenerator.get(data.lang_code, req.data.text).catch((e) => { })
        return speech
    }

    async speechToTextHandler(req, next) {
        const ID = req.params[0]
        const { Import } = cds.entities("cc.slova.model")
        const data = await cds.read(Import, ID).columns('lang_code')
        const transcription = await speechRecognition.get(data.lang_code, req.data.content).catch(() => { })
        return transcription
    }

    async addSpeechToInputHandler(req, next) {
        const ID = req.params[0]
        const { Import } = cds.entities("cc.slova.model")
        const data = await cds.read(Import, ID).columns('input')
        return cds.update(Import, ID).with({ input: (data.input ? data.input + '\n' : '') + req.data.content })
    }

    async getGoogleTranslateLinkHandler(req, next) {
        const { lang, text } = req.data
        if (!text) return
        const profile = await this.getProfile(req.user.id)
        const googleTranslateBaseUrl = 'https://translate.google.com/'
        return `${googleTranslateBaseUrl}?text=${encodeURIComponent(text)}&sl=${lang}&tl=${profile.defaultLang_code}&hl=${profile.defaultLang_code}`
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
        await this.setImportComplexity(ID)
    }

    async generateDefinitionHandler(req, next) {
        const { ID, hash } = req.data
        const { ImportSentences } = cds.entities("cc.slova.model")
        const sentence = await cds.read(ImportSentences, { import_ID: ID, hash: hash }).columns(s => {
            s.text,
                s.lang,
                s.tokens(t => { t`.*` })
        })
        return this.importHandler.callExternalDefinitionsGenerator(sentence.lang_code, [sentence])
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
        // await cds.tx(async (tx) => {
        data = await cds.read(Import, ID)
        if (req.user.id != data.createdBy) throw new Error('FORBIDDEN')
        profile = await cds.read(Users, { id: req.user.id })
        // })
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
        await this.setImportComplexity(token.importId)
    }

}

module.exports = { TextsService }