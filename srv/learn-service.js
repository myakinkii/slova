const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

class MyService extends BaseService {

    async init() {
        this.on('guessCard', this.guessCard)
        await super.init()
    }

}

module.exports = { MyService }