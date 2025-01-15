const cds = require('@sap/cds')
const crypto = require('crypto')

class OnboardService extends cds.ApplicationService {

    async init() {
        return super.init()
    }

    async generateUser()  {
        const { Users } = cds.entities("cc.slova.model")
        const id = cds.utils.uuid()
        const pwd = crypto.createHash('md5').update(cds.utils.uuid()).digest("hex")
        await cds.create(Users).entries({ id: id, pwd: pwd, defaultLang_code: 'en' })
        return {id, pwd}
    }

    async claimUser(id, pwd, name) {
        if (!name) return ''
        const { Users } = cds.entities("cc.slova.model")
        const user = await cds.read(Users,{ id: id, pwd: pwd })
        if (!user || !!user.name) return ''
        const newPwd = crypto.createHash('md5').update(id+pwd+name).digest("hex")
        await cds.update(Users, {id:id}).set({ pwd: newPwd, name: name })
        return newPwd;
    }
    
    async generatePin(id, pwd){
        const { Users } = cds.entities("cc.slova.model")
        const user = await cds.read(Users,{ id:id, pwd:pwd })
        if (!user) return ''
        const pin = Math.round(1000+9000*Math.random())
        await cds.update(Users, { id: id, pwd: pwd }).set({ pin: pin })
        return pin;
    }
    
    async fetchCreds(pin, name){
        if (pin==0) return {}
        const { Users } = cds.entities("cc.slova.model")
        const user = await cds.read(Users,{ name: name, pin: pin })
        if (!user) return {}
        await cds.update(Users, { id: user.id, pwd: user.pwd }).set({ pin: 0 })
        return { id: user.id, pwd: user.pwd, user: name }
    }
}

module.exports = { OnboardService }