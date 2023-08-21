const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

class WorkBookService extends BaseService {

    async init() {
        this.after('READ', 'Slova', this.addDefinition)
        this.after('READ', 'Sentences', this.getGoogleTranslate)
        await super.init()
    }

}

module.exports = { WorkBookService }