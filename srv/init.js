const {parseConllu, prepareWords } = require('./lib/conlluParser')
const crypto = require('crypto')

const LOG = cds.log('init')

const CONLLU_SETS = process.env.CONLLU_SETS?.split(',') || [] // ud sets in form {SET_NAME}-ud-{CHUNK}.conllu
const IMPORT_POS = process.env.IMPORT_POS?.split(',') || ['VERB', 'NOUN', 'PRON', 'ADJ', 'ADV'] // parts of speech to import
const SET_CHUNKS = ['train', 'dev', 'test'] // sets in order of precedence (usually 80/10/10 % of treebank size)
const SET_ADMIN_PWD = process.env.SET_ADMIN_PWD

module.exports = (db) => {
    const { Stat, Slova, Sentences, Etymology, Users } = db.entities('cc.slova.model')
    const run = []

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
        const lang = setName.split('_')[0]
        let dataSet = null
        for (const chunk of SET_CHUNKS){
            try {
                const data = require('fs').readFileSync(`./test/conllu/${setName}-ud-${chunk}.conllu`, 'utf8')
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
}
