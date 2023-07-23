const cds = require('@sap/cds')
const ALLOW_FAKE_USERS = !!process.env.ALLOW_FAKE_USERS // any non-empty value is true

const anonymous = {
    "/texts" : true
}
const noauth = {
    "/onboard" : true
}

module.exports = async function custom_auth (req, res, next) {
    if (noauth[req.baseUrl]) return next() // dont even go further
    const auth = req.header('Authorization')
    if (auth) {
        const basic = auth.split(" ")
        if (!basic[0]=='Basic') return res.sendStatus(400)
        try {
            const [usr, pwd] = atob(basic[1]).split(":")
            const db = await cds.connect('db')
            let user = await db.read('cc.slova.model.Users',{ id:usr })
            if (user && user.pwd != pwd ) return res.sendStatus(401) // tried and failed
            if (!user && ALLOW_FAKE_USERS) user = { id: usr } // allow fake users to login
            req.user = new cds.User({ id: user.id, roles: user.id=='admin' ? ['admin-user'] : [] })
            return next()
        } catch (e) {
            res.sendStatus(400)
        }
    } else {
        if (anonymous[req.baseUrl]) {
            req.user = new cds.User({ id: 'anonymous', roles: [] })
            return next()
        } else {
            res.setHeader('WWW-Authenticate', 'Basic realm="slova.cc"');
            return res.sendStatus(401)
        }
    }
}