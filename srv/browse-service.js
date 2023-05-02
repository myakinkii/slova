const cds = require('@sap/cds')
const { BaseService } = require('./baseService')

class UserService extends BaseService {

    async init() {
        this.after('READ', 'Slova', this.getDefinition)
        this.after('READ', 'Slova.sentences', this.getGoogleTranslate)
        this.before('READ', 'Users', this.checkCreateProfile)
        this.on('addTranslation', this.addTranslation)
        this.on('makeCard', this.makeCard)
        await super.init()
    }

}

module.exports = { UserService }