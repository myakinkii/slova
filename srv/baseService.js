const cds = require('@sap/cds')
const definitionFinder = require('./lib/definitionFinder')
const externalParser = require('./lib/externalParser')
const externalGenerator = require('./lib/externalGenerator')

class BaseService extends cds.ApplicationService {

    async checkCreateProfile(req){
        await this.getProfile(req.user.id)
    }

    async getProfile(userId) {
        const { Users } = cds.entities("cc.slova.model")
        let profile = await this.read(Users, { id: userId })
        if (!profile) {
            profile = { id: userId, defaultLang_code: 'en' }
            await this.create(Users).entries(profile)
        }
        return profile
    }
    
    async addOccurence(data, req) {
        if (!data || Array.isArray(data)) return
        const { Stat } = cds.entities("cc.slova.model")
        const stat = await cds.read(Stat,{pos:data.pos, lang:data.lang})
        const fraction = (data.occurence / stat.tokens * 100).toFixed(1)
        data.occurence = `${fraction}% - ${data.occurence} occs of ${stat.tokens} for ${data.pos} (${stat.lemmas})`
    }

    async getDefinition(data, req) {
        if (!data || Array.isArray(data)) return
        const lang = data.lang
        const profile = await this.getProfile(req.user.id)
        const userLang = profile.defaultLang_code
        let definitionUrl = data.definition
        if (!definitionUrl) definitionUrl = await definitionFinder.get(lang, data.morphem).catch( ()=>{} )
        if (!definitionUrl) return
        const googleTranslateBaseUrl = 'https://translate.google.com/translate'
        data.definition = `${googleTranslateBaseUrl}?u=${encodeURIComponent(definitionUrl)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
    }

    async getGoogleTranslate(data, req) {
        if (!data || Array.isArray(data)) return
        const lang = data["up__lang"]
        const profile = await this.getProfile(req.user.id)
        const userLang = profile.defaultLang_code
        const text = data.sent?.text
        if (!text) return
        const googleTranslateBaseUrl = 'https://translate.google.com/'
        data.translation = `${googleTranslateBaseUrl}?text=${encodeURIComponent(text)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
    }

    async callExternalParser(sentence,lang) {
        return externalParser.get(lang, sentence)
    }

    async callExternalGenerator(lang, textSize, textType, location, modifier) {
        return externalGenerator.get(lang, textSize || 'small', textType || 'text', location || 'shop', modifier || 'typical')
    }

    async getTranslations(slovo, author, lang) {
        const { Translations } = this.entities
        let where = {
            slovo_morphem: slovo.morphem,
            slovo_pos: slovo.pos,
            slovo_lang: slovo.lang
        }
        if (author) where.author_id = author
        if (lang) where.lang_code = lang
        return this.read(Translations, ['ID']).where(where)
    }

    async addTranslation(req) {
        const { Translations } = this.entities
        const slovo = req.params[0]
        const translation = req.data.value
        const profile = await this.getProfile(req.user.id)

        const translations = await this.getTranslations(slovo, profile.id, profile.defaultLang_code)
        if (translations.length > 0) return req.error(400, 'TRANSLATION_ALREADY_EXISTS')

        return this.create(Translations).entries({
            slovo: slovo,
            author_id: profile.id,
            lang_code: profile.defaultLang_code,
            value: translation
        })
    }

    async makeCard(req) {
        // const { Cards } = this.entities
        const { Cards } = cds.entities("cc.slova.model")
        const slovo = req.params[0]
        const profile = await this.getProfile(req.user.id)

        const translations = await this.getTranslations(slovo, profile.id, profile.defaultLang_code)
        if (translations.length == 0) return req.error(400, 'NO_TRANSLATION_FOUND')

        return this.create(Cards).entries({
            slovo: slovo,
            user_id: profile.id,
            count: 0,
            translation: translations[0]
        })
    }
}

module.exports = { BaseService }