const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

const DISPLAY_CARDS = +process.env.DISPLAY_CARDS || 3

class MyService extends BaseService {

    async init() {
        this.before('READ', 'Cards', this.applyFilter)
        this.on('guessCard', this.addCardGuess)
        await super.init()
    }

    async addCardGuess(req) {
        const { CardGuesses, Cards } = this.entities
        const card = req.params[0]
        const guess = req.data.value

        await this.update(Cards,card).set({ count: { '+=':1 }, seen: true, random : Math.floor((Math.random()*1000)) })

        const unseen = await cds.read(Cards, ['Count(*) as count']).where({ 
            user_id : req.user.id, and: { seen: { '!=' : true }, or: { random : null } }
        });

        if (unseen[0].count == 0 ) { // guessed it all, so loop my cards
            await this.update(Cards).set({ seen:false }).where({ user_id : req.user.id })
        }

        return this.create(CardGuesses).entries({
            card: card,
            guess: guess,
            now: '$now'
        })
    }

    async applyFilter(req) {
        req.query.where({ seen: { '!=' : true} })
        req.query.orderBy('random')
        // req.query.limit(DISPLAY_CARDS)
    }

}

module.exports = { MyService }