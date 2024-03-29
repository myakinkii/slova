const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

class AdminService extends BaseService {

    async init() {
        this.after('READ', 'Slova', this.addDefinition)
        this.after('READ', 'Slova', this.addOccurence)
        await super.init()
    }

}

module.exports = { AdminService }