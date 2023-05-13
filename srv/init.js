const {parseConllu, prepareWords } = require('./lib/conlluParser')

const LOG = cds.log('init')

const CONLLU_SETS = process.env.CONLLU_SETS?.split(',') || [] // ud sets in form {SET_NAME}-ud-{CHUNK}.conllu
const IMPORT_POS = process.env.IMPORT_POS?.split(',') || ['VERB', 'NOUN', 'PRON', 'ADJ'] // parts of speech to import
const SET_CHUNKS = ['train', 'dev', 'test'] // sets in order of precedence (usually 80/10/10 % of treebank size)

module.exports = (db) => {
    const { Slova, Sentences, Etymology, Users } = db.entities('ru.dev4hana.slova')

    let sentences = {}, words = [] // references to data
    CONLLU_SETS.forEach( set => { IMPORT_POS.reduce( getParser(set, sentences), words) })
    sentences = Object.values(sentences)
    LOG.debug(`got ${words.length} words and ${sentences.length} sentences`)

    if (words.length==0 || sentences.length==0) return // empty entries are not good for cds.run

    const etymology = [
        { root: 'gʰóstis', ascii: 'gostis', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Indo-European/g%CA%B0%C3%B3stis' },
        { root: 'slovo', ascii: 'slovo', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Slavic/slovo' }
    ]
    const users = [{ id: 'admin', defaultLang_code: 'en' }]

    return cds.run([
        INSERT.into(Slova).entries(words),
        INSERT.into(Etymology).entries(etymology),
        INSERT.into(Users).entries(users),
        INSERT.into(Sentences).entries(sentences)
    ])

    function getParser(setName, sentencesRef){
        const lang = setName.split('_')[0]
        let dataSet = null
        for (const chunk of SET_CHUNKS){
            try {
                const data = require('fs').readFileSync(`./test/conllu/${setName}-ud-${chunk}.conllu`, 'utf8')
                LOG.debug('parsing conllu set', setName, chunk)
                dataSet = parseConllu(lang, data)
                Object.assign(sentencesRef, dataSet.sentences)
                break;
            } catch (err) {
                LOG.debug(`${setName} ${chunk} error`, err.message)
            }
        }
        if (!dataSet) return (prev, cur) => prev // not to break reduce if no dataset found
        return (prev, cur) => prepareWords(lang, dataSet.words, cur, prev)
    }
}
