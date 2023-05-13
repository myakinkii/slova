const {parseConllu, prepareWords } = require('./lib/conlluParser')

const LOG = cds.log('init')

const IMPORT_POS = ['VERB', 'NOUN', 'PRON', 'ADJ']
const CONLLU_SET = 'train'
const LANG = 'hr'

const getParser = (lang, setName, sentencesRef) => {
    const data = require('fs').readFileSync(`./test/conllu/${lang}_set-ud-${setName}.conllu`, 'utf8')
    LOG.debug('parsing conllu set', setName)
    const dataSet = parseConllu(lang, data)
    Object.assign(sentencesRef, dataSet.sentences)
    return (prev, cur) => prepareWords(lang, dataSet.words, cur, prev)
}

module.exports = (db) => {
    const { Slova, Sentences, Etymology, Users } = db.entities('ru.dev4hana.slova')
    let sentences = {}
    let words = IMPORT_POS.reduce(getParser(LANG, CONLLU_SET, sentences), [])
    words = IMPORT_POS.reduce( getParser('ru', 'test', sentences), words)
    words = IMPORT_POS.reduce( getParser('cu', CONLLU_SET, sentences), words)
    LOG.debug('inserting words', words.length)
    const etymology = [
        { root: 'gʰóstis', ascii: 'gostis', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Indo-European/g%CA%B0%C3%B3stis' },
        { root: 'slovo', ascii: 'slovo', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Slavic/slovo' }
    ]
    const users = [{ id: 'alice', defaultLang_code: 'en' }]
    return cds.run([
        INSERT.into(Slova).entries(words),
        INSERT.into(Etymology).entries(etymology),
        INSERT.into(Users).entries(users),
        INSERT.into(Sentences).entries(Object.values(sentences))
    ])
}
