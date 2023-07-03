const cds = require('@sap/cds')
const ALLOW_FAKE_USERS = !!process.env.ALLOW_FAKE_USERS // any non-empty value is true

const anonymous = {
    "/onboard" : true,
    "/texts" : true
}

module.exports = async function custom_auth (req, res, next) {
    if (anonymous[req.baseUrl]) return next() // wtf it does not require auth...
    const auth = req.header('Authorization')
    if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic realm="slova.cc"');
        return res.sendStatus(401)
    }
    const basic = auth.split(" ")
    if (!basic[0]=='Basic') return res.sendStatus(400)
    try {
        const creds = atob(basic[1]).split(":")
        const db = await cds.connect('db')
        let user = await db.read('cc.slova.model.Users',{id:creds[0]})
        if (user && user.pwd != creds[1] ) return res.sendStatus(401)
        if (!user && ALLOW_FAKE_USERS) user = { id : creds[0] } // allow fake users to login
        req.user = new cds.User({ id: user.id, roles: user.id=='admin' ? ['admin-user'] : [] })
        next()
    } catch (e) {
        res.sendStatus(400)
    }
}