module.exports = (compound) ->

    initializer = require('socket_listener').serverInitializer

    initializer compound, ['alarm.*']