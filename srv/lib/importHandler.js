const {parseConllu, prepareWords, performMerge } = require('./conlluParser')
const externalParser = require('./externalParser')
const externalGenerator = require('./externalGenerator')

const DEFAULT_IMPORT_POS = process.env.IMPORT_POS || "VERB,NOUN,PRON,ADJ,ADV" // parts of speech to import

class ImportHandler {

    static get IMPORT_POS () {
        return DEFAULT_IMPORT_POS.split(",")
    }

    cdsRef

    constructor(cdsObj){
        this.cdsRef = cdsObj
    }

    async callExternalParser(sentence,lang) {
        return externalParser.get(lang, sentence)
    }

    async callExternalGenerator(lang, textSize, textType, location, modifier) {
        return externalGenerator.get(lang, textSize || 'small', textType || 'text', location || 'shop', modifier || 'typical')
    }

    async callExternalMassGenerator() {
        return externalGenerator.getAll()
    }

    async massCreateImportsFrom(source){
        const { Import } = this.cdsRef.entities("cc.slova.model")
        const { INSERT, UPSERT, UPDATE} = this.cdsRef.ql
        const owner = 'admin'
        return this.cdsRef.run(source.map( s => INSERT.into(Import).entries({ 
                ID: cds.utils.uuid(), createdBy: owner, 
                name: s.name, lang_code: s.lang, input: s.input.join("\n")
            })
        ))
    }

    async parseSentence(sentence, lang) {
        const stanzaTokens = await this.callExternalParser(sentence, lang)
        const conlluTokens = stanzaTokens.map( t => `${t.id||t.index}\t${t.text||t.word}\t${t.lemma}\t${t.upos}\t_\t${t.feats||'_'}` )
        return conlluTokens.join("\n")
    }

    async parseMultiline(input, lang) {
        const stanzaSentences = await this.callExternalParser(input, lang)
        const text = stanzaSentences.reduce( (prev, cur, index) => {
            const conlluTokens = cur.map( t => `${t.id||t.index}\t${t.text||t.word}\t${t.lemma}\t${t.upos}\t_\t${t.feats||'_'}` )
            return prev += `\n# text = ${input[index]}\n` + conlluTokens.join("\n") + '\n'
        },'')
        return text
    }

    async parseInput(ID, pos ) {
        if (!pos) pos = DEFAULT_IMPORT_POS
        const { Import } = this.cdsRef.entities("cc.slova.model")
        const data = await this.cdsRef.read(Import, ID)
        const lang = data.lang_code
        const results = parseConllu(lang, data.text || '')
        let words = pos.split(",").reduce( (prev,cur) => {
            return prepareWords(lang, results.words, cur, prev)
        },[])
        words.forEach( w => {
            w.import_ID = ID
            w.sentences.forEach(s => { s["sent_import_ID"] = ID })
        })
        await this.cdsRef.update(Import, ID).with({
            words : words,
            sentences : Object.values(results.sentences).map( s => Object.assign( s, { import_ID: ID } ))
        })
        return { ID: ID }
    }

    async performImport(ID) {

        const newData = await this.getImportData(ID)
        const existingData = await this.getExistingDataFor(newData)

        const result = performMerge(newData, existingData)

        const existingStat = await this.getExistingStatFor(result.stat)
        for (let k in existingStat){
            // here we also assume that k is statkey = `${pos}_${lang}` from performMerge
            if (existingStat[k]) {
                result.stat[k].lemmas += existingStat[k].lemmas
                result.stat[k].tokens += existingStat[k].tokens
            }
        }
        // basically this stuff above is insert or update with increment depending on data we merge

        await this.setImportData(ID,{ status:9, publishDate: new Date() })
        return this.cdsRef.run(this.makeQueriesFrom(result))
    }


    async setImportData(ID,data){
        const { Import } = this.cdsRef.entities("cc.slova.model")
        return this.cdsRef.update(Import, ID).with(data)
    }

    async getImportData(ID){
        const { Import } = this.cdsRef.entities("cc.slova.model")

        return this.cdsRef.read(Import, ID).columns( i => { 
            i.ID,
            i.createdBy,
            i.words ( w => { 
                w`.*`, 
                w.forms(f => { f`.*` }),
                w.sentences(s => { s`.*` })
            }),
            i.sentences(s => { s`.*`, s.tokens( t => { t`.*` }) })
        })
    }

    async getExistingDataFor(newData){
        const { Slova } = this.cdsRef.entities("cc.slova.model")
        const existingData = {}
        
        return Promise.all(newData.words.map( w => {
            const { morphem, pos, lang } = w
            const key = `${morphem}_${pos}_${lang}` // we use same key im performMerge
            return new Promise( (resolve,reject) => {
                this.cdsRef.read(Slova,{ morphem, pos, lang }).columns( w => { 
                    w`.*`, 
                    w.forms(f => { f`.*` }),
                    w.sentences(s => { s.sent_hash })
                }).then( re => { existingData[key]=re; resolve() }, err => { existingData[key]={}; resolve()} )
            })
        })).then( () => existingData)
    }

    async getExistingStatFor(newStat){
        const { Stat } = this.cdsRef.entities("cc.slova.model")
        const existingStat = {}
        
        return Promise.all(Object.keys(newStat).map( key => {
            // here we assume that statkey = `${pos}_${lang}` in performMerge
            const [pos, lang] = key.split("_")
            return new Promise( (resolve,reject) => {
                this.cdsRef.read(Stat,{ pos, lang }).then( re => { existingStat[key]=re; resolve() }, err => { existingStat[key]={}; resolve()} )
            })
        })).then( () => existingStat)
    }

    makeQueriesFrom(result){
        const { Slova, Sentences, Stat } = this.cdsRef.entities("cc.slova.model")
        const { INSERT, UPSERT, UPDATE} = this.cdsRef.ql

        const queries = []

        Object.values(result.update.words).forEach( upd => {
            const { morphem, pos, lang } = upd
            queries.push( UPDATE(Slova,{ morphem, pos, lang }).with(upd) )
        })

        if (Object.keys(result.insert.sentences).length>0){
            queries.push( INSERT.into(Sentences).entries(Object.values(result.insert.sentences)) )
        }
        if (Object.keys(result.insert.words).length>0){
            queries.push( INSERT.into(Slova).entries(Object.values(result.insert.words)) )
        }

        if (queries.length) {
            queries.push( UPSERT.into(Stat).entries(Object.values(result.stat)) )
        }

        return queries
    }

    mergeAndCreateConllu(merge, sentences){
        sentences.sort( (s1,s2) => s1.index-s2.index ) // do in-place sort
        let text = '\n'
        sentences.forEach( sent => {
            text+=`# text = ${sent.text}\n`
            sent.tokens.forEach( token => {
                if ( token.sentence_hash == merge.hash && token.index == merge.index ){
                    token.lemma = merge.lemma
                    token.pos = merge.pos
                    token.feats = merge.feats
                }
                text+= `${token.index+1}\t${token.form}\t${token.lemma}\t${token.pos}\t_\t${token.feats||'_'}\n`
            })
            text+=`\n`
        })

        return text
    }
}

module.exports = ImportHandler