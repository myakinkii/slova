const {parseConllu, prepareWords, performMerge } = require('./lib/conlluParser')

const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

const IMPORT_POS = process.env.IMPORT_POS?.split(',') || ['VERB', 'NOUN', 'PRON', 'ADJ', 'ADV'] // parts of speech to import

class TextsService extends BaseService {

    async init() {
        this.on('syncToken', this.syncAndReparseConllu)
        await super.init()
    }

    async syncAndReparseConllu(req, next) {
        const { Import } = cds.entities("cc.slova.model")
        const { token } = req.data
        const importData = await this.getImportData(token.importId)
        const text = this.mergeAndCreateConllu(token, importData.sentences.sort( (s1,s2) => s1.index-s2.index ))
        await cds.update(Import, token.importId).with({text})
        await this.parseInput(token.importId)
    }

    mergeAndCreateConllu(merge, sentences){
        let text = '\n'
        sentences.forEach( sent => {
            text+=`# text = ${sent.text}\n`
            sent.tokens.forEach( token => {
                if ( token.sentence_hash == merge.hash && token.index == merge.index ){
                    token.lemma = merge.lemma
                    token.pos = merge.pos
                    token.feats = merge.feats
                }
                text+= `${token.index}\t${token.form}\t${token.lemma}\t${token.pos}\t_\t${token.feats||'_'}\n`
            })
            text+=`\n`
        })

        return text
    }

    async getImportData(ID){
        const { Import } = cds.entities("cc.slova.model")

        return cds.read(Import, ID).columns( i => { 
            i.ID, 
            // i.words ( w => { 
            //     w`.*`, 
            //     w.forms(f => { f`.*` }),
            //     w.sentences(s => { s`.*` })
            // }),
            i.sentences(s => { s`.*`, s.tokens( t => { t`.*` }) })
        })
    }

    async parseInput (ID) {
        const { Import } = cds.entities("cc.slova.model")
        const data = await cds.read(Import, ID)
        const lang = data.lang_code
        const results = parseConllu(lang, data.text || '')
        let words = IMPORT_POS.reduce( (prev,cur) => {
            return prepareWords(lang, results.words, cur, prev)
        },[])
        words.forEach( w => {
            w.sentences.forEach(s => { s["sent_import_ID"] = ID })
        })
        await cds.update(Import, ID).with({
            words : words,
            sentences : Object.values(results.sentences)
        })
        return { ID: ID }
    }

}

module.exports = { TextsService }