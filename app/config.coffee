americano = require 'americano'

module.exports =

    common: [
        americano.static __dirname + '/../client/public', maxAge: 86400000
        americano.bodyParser keepExtensions: true
        americano.errorHandler
            dumpExceptions: true
            showStack: true
    ]

    development: [
        americano.logger 'dev'
    ]

    production: [
        americano.logger 'short'
    ]

    plugins: [
        'americano-cozy'
    ]
