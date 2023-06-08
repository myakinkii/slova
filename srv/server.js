const cds = require('@sap/cds')
module.exports = cds.server

if (process.env.NODE_ENV !== 'production') {
    cds.on('bootstrap', app => {
        app.use(require('cds-swagger-ui-express')())
        app.use(require('cors')())
    })
}
