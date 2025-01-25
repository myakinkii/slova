const cds = require('@sap/cds')
const crypto = require('crypto')
const definitionFinder = require('./lib/definitionFinder')

class BaseService extends cds.ApplicationService {

    async checkCreateProfile(req) {
        await this.getProfile(req.user.id)
    }

    getPwdHash(pwdString) {
        return crypto.createHash('md5').update(pwdString).digest("hex")
    }

    async getProfile(userId) {
        const { Users } = cds.entities("cc.slova.model")
        let profile = await this.read(Users, { id: userId })
        if (!profile) {
            profile = { id: userId, pwd: '', defaultLang_code: 'en' }
            await this.create(Users).entries(profile)
        }
        return profile
    }

    async addOccurence(results, req) {
        if (!req.query.SELECT.one) return
        const data = results[0]
        const { Stat } = cds.entities("cc.slova.model")
        const stat = await cds.read(Stat, { pos: data.pos, lang: data.lang })
        const fraction = (data.occurence / stat.tokens * 100).toFixed(1)
        data.occurence = `${fraction}% - ${data.occurence} occs of ${stat.tokens} for ${data.pos} (${stat.lemmas})`
    }

    async getDefinition(lang, lemma, user) {
        const profile = await this.getProfile(user)
        const userLang = profile.id == "anynoumous" ? "auto" : profile.defaultLang_code
        const definitionUrl = await definitionFinder.get(lang, lemma).catch(() => { })
        if (!definitionUrl) return ''
        const googleTranslateBaseUrl = 'https://translate.google.com/translate'
        return `${googleTranslateBaseUrl}?u=${encodeURIComponent(definitionUrl)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
    }

    async addDefinition(results, req) {
        if (!req.query.SELECT.one) return
        const data = results[0]
        const { lang, lemma, morphem } = data
        if (!data.definition) data.definition = await this.getDefinition(lang, morphem || lemma, req.user.id)
    }

    async getGoogleTranslate(results, req) {
        if (!req.query.SELECT.one) return
        const data = results[0]
        const lang = data["lang"] || data["up__lang"]
        const profile = await this.getProfile(req.user.id)
        const userLang = profile.defaultLang_code
        const text = data.text || data.sent?.text
        if (!text) return
        const googleTranslateBaseUrl = 'https://translate.google.com/'
        data.translation = `${googleTranslateBaseUrl}?text=${encodeURIComponent(text)}&sl=${lang}&tl=${userLang}&hl=${userLang}`
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

    async skipWordToggleHandler(req) {
        // add me to workbook as well
        const { morphem, pos, lang } = req.params[0]
        const key = {
            user_id: req.user.id,
            slovo_morphem: morphem,
            slovo_lang: lang,
            slovo_pos: pos
        }
        const { Skips } = cds.entities("cc.slova.model")
        const del = await cds.delete(Skips).where(key)
        if (del == 1) return false
        await cds.create(Skips).entries(key)
        return true
    }

    async setImportComplexity(ID) {
        const { Slova } = cds.entities("TextsService")
        const words = await cds.read(Slova).where({ import_ID: ID }).columns('tier').then(res => res.reduce((prev, cur) => {
            if (!prev.tiers[cur.tier]) prev.tiers[cur.tier] = 0
            prev.tiers[cur.tier]++
            prev.total++
            return prev
        }, { tiers: {}, total: 0 }))

        const complexity = Object.entries(words.tiers).sort((w1, w2) => {
            return w1[0] > w2[0] ? 1 : -1 // tier asc
        }).map(([tier, total]) => {
            return `${tier}: ${(total / words.total * 100).toFixed(0)}%`
        }).join(", ")

        const { Import } = cds.entities("cc.slova.model")
        await cds.update(Import, ID).with({ complexity })
    }
}

module.exports = { BaseService }