const ImportHandler = require('./lib/importHandler')
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
        const importHandler = new ImportHandler(cds)
        await Promise.all(CONLLU_DIRS.map( async set => {
            const [ lang, dir ] = set.split("_")
            const files = await readFolder(lang, dir)
            LOG.debug(`got ${files.length} files in ${dir}`)
            for( var file of files){
                LOG.debug(`importing [${lang}] ${file}`)
                const {results} = await importText(lang, dir, file)
                const ID = results[0].values[7] // omg this is ugly
                await importHandler.parseInput(ID, Import)
                const result = await importHandler.performImport(ID)
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

}
