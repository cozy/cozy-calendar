americano = require 'americano'
fs = require 'fs'
path = require 'path'

publicPath = "#{__dirname}/../client/public"
staticMiddleware = americano.static publicPath, maxAge: 86400000
publicStatic = (req, res, next) ->

    # Allows assets to be loaded from any route
    detectAssets = /\/(stylesheets|javascripts|images|fonts)+\/(.+)$/
    assetsMatched = detectAssets.exec req.url

    if assetsMatched?
        req.url = assetsMatched[0]

    staticMiddleware req, res, (err) -> next err

viewsDir = path.resolve __dirname, '..', 'client', 'public'
useBuildView = fs.existsSync path.resolve viewsDir, 'index.js'

module.exports =

    common:
        use: [
            staticMiddleware
            publicStatic
            americano.bodyParser keepExtensions: true
        ]
        useAfter: [
            americano.errorHandler
                dumpExceptions: true
                showStack: true
        ]
        set:
            views: viewsDir
            'view engine': if useBuildView then 'js' else 'jade'

        engine:
            js: (path, locales, callback) ->
                callback null, require(path)(locales)

    development: [
        americano.logger 'dev'
    ]

    production: [
        americano.logger 'short'
    ]

    plugins: [
        'cozydb'
    ]
