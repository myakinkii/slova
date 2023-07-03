const {parseConllu, prepareWords, performMerge} = require('./lib/conlluParser')
const crypto = require('crypto')
const fs = require('fs')

const LOG = cds.log('init')

const CONLLU_DIRS = process.env.CONLLU_DIRS?.split(',') || [] // dirs with conllu files in form {LANG}/{SET_NAME}
const CONLLU_SETS = process.env.CONLLU_SETS?.split(',') || [] // ud sets in form {SET_NAME}-ud-{CHUNK}.conllu
const SET_CHUNKS = ['train', 'dev', 'test'] // sets in order of precedence (usually 80/10/10 % of treebank size)

const IMPORT_POS = process.env.IMPORT_POS?.split(',') || ['VERB', 'NOUN', 'PRON', 'ADJ', 'ADV'] // parts of speech to impor

const SET_ADMIN_PWD = process.env.SET_ADMIN_PWD // to reset admin pwd from default 'secret'

module.exports = async (db) => {
    const { Stat, Slova, Sentences, Etymology, Users, Import } = db.entities('cc.slova.model')
    const run = []

    if (CONLLU_SETS.length) {
        let sentences = {}, stat = [], words = [] // references to data
        CONLLU_SETS.forEach( set => { IMPORT_POS.reduce( getParser(set, sentences, stat), words) })
        sentences = Object.values(sentences)
        LOG.debug(`got ${words.length} words and ${sentences.length} sentences`)

        if (words.length>0 && sentences.length>0 ){
            run.push(
                INSERT.into(Slova).entries(words),
                INSERT.into(Sentences).entries(sentences),
                INSERT.into(Stat).entries(stat)
            )
        }
    } else if (CONLLU_DIRS.length) {
        await Promise.all(CONLLU_DIRS.map( async set => {
            const [ lang, dir ] = set.split("_")
            const files = await readFolder(lang, dir)
            LOG.debug(`got ${files.length} files in ${dir}`)
            for( var file of files){
                LOG.debug(`importing [${lang}] ${file}`)
                const {results} = await importText(lang, dir, file)
                const ID = results[0].values[7] // omg this is ugly
                await parseInput(ID)
                const result = await performImport(ID)
                const stat = result.length && result[result.length-1].reduce( (prev,cur) => {
                    const [lang, pos, tokens, lemmas] = cur.values
                    prev[pos] = {lemmas,tokens}
                    prev.total+=lemmas
                    return prev
                },{total:0})
                LOG.debug(`import stat:`,stat)
            }
        }))
    }

    const etymology = [
        { root: 'gʰóstis', ascii: 'gostis', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Indo-European/g%CA%B0%C3%B3stis' },
        { root: 'slovo', ascii: 'slovo', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Slavic/slovo' }
    ]
    run.push(
        INSERT.into(Etymology).entries(etymology)
    )

    let pwd = 'secret'
    if (typeof SET_ADMIN_PWD=='string'){ // replace default one
        if (SET_ADMIN_PWD) pwd = SET_ADMIN_PWD // which one to set
        else pwd = crypto.createHash('md5').update(cds.utils.uuid()).digest("hex") // or generate
    } 
    LOG.info('admin pwd',pwd)
    const users = [{ id: 'admin', pwd: pwd, defaultLang_code: 'en' }]
    run.push(
        INSERT.into(Users).entries(users)
    )

    return cds.run(run)

    function getParser(setName, sentencesRef, statRef){
        const [ lang, dir ] = setName.split("_")
        let dataSet = null
        for (const chunk of SET_CHUNKS){
            try {
                const data = require('fs').readFileSync(`./test/conllu/${lang}/${dir}/${setName}-ud-${chunk}.conllu`, 'utf8')
                LOG.debug('parsing conllu set', setName, chunk)
                dataSet = parseConllu(lang, data)
                Object.assign(sentencesRef, dataSet.sentences)
                statRef.push.apply(statRef,Object.values(dataSet.stat))
                break;
            } catch (err) {
                LOG.debug(`${setName} ${chunk} error`, err.message)
            }
        }
        if (!dataSet) return (prev, cur) => prev // not to break reduce if no dataset found
        return (prev, cur) => prepareWords(lang, dataSet.words, cur, prev)
    }

    async function readFolder(lang, dir){
        return new Promise((resolve,reject)=>{
            fs.readdir(`./test/conllu/${lang}/${dir}`,(err, files) => err ? reject(err) : resolve(files) )
        })
    }

    async function importText (lang, dir, fileName) {
        const data = fs.readFileSync(`./test/conllu/${lang}/${dir}/${fileName}`, 'utf8')
        const name = dir+" - "+fileName.slice(0,-7)
        return cds.create(Import).entries({ name: name, text: data, lang_code: lang, createdBy: 'admin' })
    }

    // this is CODE DUPLICATION FROM import-service.js ;(
    // we have dependencies to cds and entties
    // but somehow need to refactor this

    async function parseInput (ID) {
        // const { Import } = this.entities
        // const ID = pars.ID
        const data = await cds.read(Import, ID)
        const lang = data.lang_code
        const results = parseConllu(lang, data.text || '')
        let words = IMPORT_POS.reduce( (prev,cur) => {
            return prepareWords(lang, results.words, cur, prev)
        },[])
        words.forEach( w => {
            w.sentences.forEach(s => { s["sent_import_ID"] = ID })
        })
        return cds.update(Import, ID).with({
            words : words,
            sentences : Object.values(results.sentences)
        })
    }

    async function performImport(ID) {

        const newData = await getImportData(ID)
        const existingData = await getExistingDataFor(newData)

        const result = performMerge(newData, existingData)

        const existingStat = await getExistingStatFor(result.stat)
        for (let k in existingStat){
            // here we also assume that k is statkey = `${pos}_${lang}` from performMerge
            if (existingStat[k]) {
                result.stat[k].lemmas += existingStat[k].lemmas
                result.stat[k].tokens += existingStat[k].tokens
            }
        }
        // basically this stuff above is insert or update with increment depending on data we merge

        return cds.run(makeQueriesFrom(result))
    }

    async function getImportData(ID){
        // const { Import } = this.entities

        return cds.read(Import, ID).columns( i => { 
            i.ID, 
            i.words ( w => { 
                w`.*`, 
                w.forms(f => { f`.*` }),
                w.sentences(s => { s`.*` })
            }),
            i.sentences(s => { s`.*`, s.tokens( t => { t`.*` }) })
        })
    }

    async function getExistingDataFor(newData){
        // const { Slova } = cds.entities("cc.slova.model")
        const existingData = {}
        
        return Promise.all(newData.words.map( w => {
            const { morphem, pos, lang } = w
            const key = `${morphem}_${pos}_${lang}` // we use same key im performMerge
            return new Promise( (resolve,reject) => {
                cds.read(Slova,{ morphem, pos, lang }).columns( w => { 
                    w`.*`, 
                    w.forms(f => { f`.*` }),
                    w.sentences(s => { s.sent_hash })
                }).then( re => { existingData[key]=re; resolve() }, err => { existingData[key]={}; resolve()} )
            })
        })).then( () => existingData)
    }

    async function getExistingStatFor(newStat){
        // const { Stat } = cds.entities("cc.slova.model")
        const existingStat = {}
        
        return Promise.all(Object.keys(newStat).map( key => {
            // here we assume that statkey = `${pos}_${lang}` in performMerge
            const [pos, lang] = key.split("_")
            return new Promise( (resolve,reject) => {
                cds.read(Stat,{ pos, lang }).then( re => { existingStat[key]=re; resolve() }, err => { existingStat[key]={}; resolve()} )
            })
        })).then( () => existingStat)
    }

    function makeQueriesFrom(result){
        // const { Slova, Sentences, Stat } = cds.entities("cc.slova.model")
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

}
