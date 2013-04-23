module.exports = (compound) ->

    initializer = require('cozy-realtime-adapter')

    initializer compound, ['alarm.*']