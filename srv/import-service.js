const cds = require('@sap/cds')
const ImportHandler = require('./lib/importHandler')
const fs = require('fs')

const { BaseService } = require('./baseService')

class ImportService extends BaseService {

    importHandler

    async init() {
        this.importHandler = new ImportHandler(cds)
        this.on('addSentence', this.addSentence)
        this.on('addWord', this.addWord)
        this.on('askHelp', this.askHelpHandler)
        this.on('generateInput', this.generateInputHandler)
        this.on('parseText', this.parseTextHandler)
        this.on('parseInput', this.parseInputHandler)
        this.on('mergeResults', this.performImportHandler)
        this.on('generateAll', this.performMassGenerationHandler)
        this.on('parseAll', this.performMassParsingHandler)
        this.on('defineAll', this.performMassDefinitionHandler)
        this.on('exportAll', this.performExportHandler)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        await super.init()
    }

    async generateInputHandler(req, next) {
        const { ID } = req.params[0]
        const { Import } = this.entities
        const data = await cds.read(Import.drafts, ID)
        const chatGptResponse = await this.importHandler.callExternalGenerator(data.lang_code, data.textSize_code, data.textType_code, data.textLocation_code, data.textModifier_code, )
        return cds.update(Import.drafts, ID).with({ input : chatGptResponse.replaceAll('\n\n','\n') })
    }

    async askHelpHandler(req, next) {
        const { ID } = req.params[0]
        const { Import } = this.entities
        const data = await cds.read(Import.drafts, ID)
        const conlluTokens = await this.importHandler.parseSentence(data.sent, data.lang_code)
        return cds.update(Import.drafts, ID).with({
            sent: '', indx : '', lemma:'',
            text: `${data.text||''}` + `${conlluTokens}\n`
        })
    }

    async parseTextHandler(req,next){
        const { ID } = req.params[0]
        const { Import } = this.entities
        const data = await cds.read(Import.drafts, ID)
        if (!data.input) return
        const input = data.input.split("\n").filter( sent => !!sent )
        const text = await this.importHandler.parseMultiline(input, data.lang_code)
        await cds.update(Import.drafts, ID).with({text})
    }

    async parseInputHandler (req, next) {
        const { ID } = req.params[0]
        return this.importHandler.parseInput(ID)
    }

    async performImportHandler(req, next) {
        const {ID} = req.params[0]
        return this.importHandler.performImport(ID)
    }

    async performMassGenerationHandler(req, next) {
        const { Import } = this.entities
        const owner = req.data.user || 'admin'
        const langs = req.data.langs?.split("|")
        const topics = req.data.topics?.split("|")
        const generatedTexts = await this.importHandler.callExternalMassGenerator(langs, topics)
        const result = await this.importHandler.massCreateImportsFrom(generatedTexts, owner)
        return result.length
    }

    async performMassParsingHandler(req, next) {
        const { Import } = this.entities
        const owner = req.data.user || 'admin'
        const profile = await this.getProfile(owner)
        const all = await cds.read(Import).columns('ID', 'lang_code', 'input').where({ createdBy : owner })
        for (let imp of all){
            const text = await this.importHandler.parseMultiline(imp.input.split("\n"), imp.lang_code)
            await cds.update(Import, imp.ID).with({ text })
            await this.importHandler.parseInput(imp.ID, profile.pos)
        }
        return all.length     
    }

    async performMassDefinitionHandler(req, next) {
        const { Import } = this.entities
        const owner = req.data.user || 'admin'
        // coming soon
    }

    async performExportHandler(req, next) {
        const { Import } = this.entities
        const query = cds.read(Import).columns('createdBy','lang_code','name','text')
        if (req.data.user) query.where({ createdBy: req.data.user })
        const all = await query
        const nameSeparator = ' - ' // we treat first part as dir (set name)
        all.forEach( t => {
            let exportDir = './test/export'
            try {
                if (!fs.existsSync(exportDir=`${exportDir}/${t.createdBy}`)) fs.mkdirSync(exportDir)
                if (!fs.existsSync(exportDir=`${exportDir}/${t.lang_code}`)) fs.mkdirSync(exportDir)
                const nameArr = t.name.split(nameSeparator)
                const dir = nameArr.length > 1 ? nameArr.shift() : null
                if (dir && !fs.existsSync(exportDir=`${exportDir}/${dir}`)) fs.mkdirSync(exportDir)
                const fileName = `${exportDir}/${ nameArr.join(nameSeparator) }.conllu`
                const content = t.text || ''
                fs.writeFileSync(fileName, content)
            } catch (e){
                console.log(e)
            }
        })
        return all.length
    }

    async addSentence(entity, pars) {
        const { Import } = this.entities
        const ID = pars.ID
        const data = await cds.read(Import.drafts, ID)
        const tokens = data.sent.split(" ")
        await cds.update(Import.drafts, ID).with({
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
        await cds.update(Import.drafts, ID).with({
            indx: data.indx+1, lemma: tokens[data.indx]?.toLowerCase() || '',
            pos_code: '', feats: '', 
            case_code: '', gender_code: '', number_code: '', person_code: '', tense_code: '', aspect_code: '', mood_code: '', voice_code: '', degree_code: '', verbForm_code: '',
            text: `${data.text||''}` + `${data.indx}\t${data.form}\t${data.lemma}\t${data.pos_code}\t_\t${data.feats.join('|')}\n`
        })
    }

    async getGoogleTranslate(results, req) {
        if (!req.query.SELECT.one) return
        const data = results[0]
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