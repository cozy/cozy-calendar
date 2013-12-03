americano = require 'americano'

staticMiddleware = americano.static __dirname + '/../client/public', maxAge: 86400000

module.exports =

    common: [
        staticMiddleware
        (req, res, next) ->
            req.url = req.url.replace '/public', ''
            staticMiddleware req, res, (err) ->
                req.url = '/public' + req.url if req.url isnt req.originalUrl
                next err

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
