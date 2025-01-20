const ImportHandler = require('./lib/importHandler')
const { parseConllu, prepareWords, performMerge } = require('./lib/conlluParser')
const crypto = require('crypto')
const fs = require('fs')

const LOG = cds.log('init')

const CONLLU_USER = process.env.CONLLU_USER // import texts for any user id
const CONLLU_DIRS = process.env.CONLLU_DIRS?.split(',') || [] // dirs with conllu files in form {LANG}/{SET_NAME}
const CONLLU_DIRS_ROOT = process.env.CONLLU_DIRS_ROOT // root dir for folder import

const CONLLU_SETS = process.env.CONLLU_SETS?.split(',') || [] // ud sets in form {SET_NAME}-ud-{CHUNK}.conllu
const SET_CHUNKS = ['train', 'dev', 'test'] // sets in order of precedence (usually 80/10/10 % of treebank size)

const SET_ADMIN_PWD = process.env.SET_ADMIN_PWD // to reset admin pwd from default 'secret'

module.exports = async (db) => {
    const { Stat, Slova, Sentences, Etymology, Users, Import } = db.entities('cc.slova.model')

    if (CONLLU_SETS.length) {
        let sentences = {}, stat = [], words = [] // references to data
        CONLLU_SETS.forEach(set => { ImportHandler.IMPORT_POS.reduce(getParser(set, sentences, stat), words) })
        sentences = Object.values(sentences)
        LOG.debug(`got ${words.length} words and ${sentences.length} sentences`)

        if (words.length > 0 && sentences.length > 0) {
            await cds.run([
                INSERT.into(Slova).entries(words),
                INSERT.into(Sentences).entries(sentences),
                INSERT.into(Stat).entries(stat)
            ])
        }
    } else if (CONLLU_DIRS.length) {
        const importHandler = new ImportHandler(cds)
        const owner = CONLLU_USER || 'admin'
        await Promise.all(CONLLU_DIRS.map(async set => {
            const [lang, dir] = set.split("_")
            const files = await readFolder(lang, dir)
            LOG.debug(`got ${files.length} files in ${dir}`)
            for (var file of files) {
                LOG.debug(`importing [${lang}] ${file}`)
                const ID = await createOrUpdateImportText(lang, dir, file, owner)
                await importHandler.parseInput(ID)
                if (owner=='admin') await importHandler.performImport(ID)
            }
        }))
    }

    const admin = await cds.read(Users, { id: 'admin' })
    if (admin) return // redeploy

    const etymology = [
        { root: 'gʰóstis', ascii: 'gostis', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Indo-European/g%CA%B0%C3%B3stis' },
        { root: 'slovo', ascii: 'slovo', reference: 'https://en.wiktionary.org/wiki/Reconstruction:Proto-Slavic/slovo' }
    ]
    await cds.run(
        INSERT.into(Etymology).entries(etymology)
    )

    let pwd = 'secret'
    if (typeof SET_ADMIN_PWD == 'string') { // replace default one
        if (SET_ADMIN_PWD) pwd = SET_ADMIN_PWD // which one to set
        else pwd = crypto.createHash('md5').update(cds.utils.uuid()).digest("hex") // or generate
    }
    LOG.info('admin pwd', pwd)
    const users = [{ id: 'admin', pwd: pwd, defaultLang_code: 'en' }]
    await cds.run(
        INSERT.into(Users).entries(users)
    )

    function getParser(setName, sentencesRef, statRef) {
        const [lang, dir] = setName.split("_")
        let dataSet = null
        for (const chunk of SET_CHUNKS) {
            try {
                const data = require('fs').readFileSync(`./test/conllu/sets/${lang}/${dir}/${setName}-ud-${chunk}.conllu`, 'utf8')
                LOG.debug('parsing conllu set', setName, chunk)
                dataSet = parseConllu(lang, data)
                Object.assign(sentencesRef, dataSet.sentences)
                statRef.push.apply(statRef, Object.values(dataSet.stat))
                break;
            } catch (err) {
                LOG.debug(`${setName} ${chunk} error`, err.message)
            }
        }
        if (!dataSet) return (prev, cur) => prev // not to break reduce if no dataset found
        return (prev, cur) => prepareWords(lang, dataSet.words, cur, prev)
    }

    async function readFolder(lang, dir) {
        const importDir = CONLLU_DIRS_ROOT || './test/conllu'
        return new Promise((resolve, reject) => {
            fs.readdir(`${importDir}/${lang}/${dir}`, (err, files) => err ? resolve([]) : resolve(files))
        })
    }

    async function createOrUpdateImportText(lang, dir, fileName, owner) {
        const importDir = CONLLU_DIRS_ROOT || './test/conllu'
        const name = dir + " - " + fileName.slice(0, -7) // remove ".conllu"
        const data = fs.readFileSync(`${importDir}/${lang}/${dir}/${fileName}`, 'utf8')
        const input = data.split('\n').filter( s => s.startsWith("#")).map( s => s.replace("# text = ","")).join("\n")
        const exists = await cds.read(Import,{ lang_code:lang, name: name, createdBy: owner }).columns('ID')
        if (exists){
            await cds.update(Import,{ ID: exists.ID }).with({ input, text: data })
            return exists.ID
        } else {
            const ID = cds.utils.uuid()
            await cds.create(Import).entries({ ID: ID, name: name, text: data, lang_code: lang, createdBy: owner, input })
            return ID
        }
    }

}
