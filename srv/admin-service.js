const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

const F10WD_RATIO = process.env.F10WD_RATIO || 'NOUN:5,VERB:2,ADJ:2,ADV:1'
const F10WD_TIERS = process.env.F10WD_TIERS || 'A1:1000,A2:1500,B1:2500,B2:5000,C'

const calcTiersFor = (words, stats, ratios, tiers) => {
    const ranking = Object.entries(ratios).reduce( (prev, [pos, ratio]) => {
        prev[pos] = tiers.map( t => ({ pos, tier: t.tier, lim: t.lim * ratio/10  }))
        return prev
    }, {})
    
    words.sort( (w1, w2) => { // pos first
        if (w1.pos != w2.pos) return w1.pos > w2.pos ? 1 : -1 // asc
        return w2.count - w1.count // desc
        const stat = stats[w1.pos]
        w1.occ = w1.count / stat.tokens * 100
        w2.occ = w2.count / stat.tokens * 100
        return w2.occ - w1.occ // desc
    })

    let current, counter=0
    words.forEach(w => {
        if (!ranking[w.pos]) { // we don't know who you are
            w.tier = tiers[0].tier // for now
            return
        }
        if (!current) current = ranking[w.pos].shift() // start
        if ( w.pos != current.pos || current.lim && current.lim == counter) {
            current = ranking[w.pos].shift()
            counter = 0
        }
        w.tier = current.tier
        counter++
    })
}

class AdminService extends BaseService {

    async init() {
        this.after('READ', 'Slova', this.addDefinition)
        // this.after('READ', 'Slova', this.addOccurence)
        this.on('rankWords', this.rankWordsHandler)
        await super.init()
    }

    async rankWordsHandler(req, next) {
        const { lang } = req.data
        if(!lang) return

        const { Slova } = this.entities
        const words = await cds.read(Slova).columns('morphem', 'pos', 'lang', 'count').where({ lang })

        const { Stat } = cds.entities("cc.slova.model")
        const stats = await cds.read(Stat).where({ lang }).then( res => res.reduce( (prev, cur) => {
            prev[cur.pos]=cur
            return prev
        }, {} ))

        const ratios = F10WD_RATIO.split(',').reduce( (prev,cur) => {
            const [pos, r] = cur.split(":")
            prev[pos] = r
            return prev
        },{})

        const tiers = F10WD_TIERS.split(',').map( t => {
            const [tier, lim] = t.split(":")
            return {tier, lim}
        })

        calcTiersFor(words, stats, ratios, tiers) // basically we just set tier here modifying words
        await Promise.all(words.map( ({morphem, lang, pos, tier}) => cds.update(Slova,{ morphem, lang, pos }).with({ tier })))

        const { Import } = cds.entities("cc.slova.model")
        const texts = await cds.read(Import,['ID']).where({lang_code: lang})
        for (let t of texts) {
            await this.setImportComplexity(t.ID)
        }

        return `words total: ${words.length}, texts updated: ${texts.length}`
    }

}

module.exports = { AdminService }