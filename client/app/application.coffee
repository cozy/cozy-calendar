module.exports =

    initialize: ->
        Router = require 'router'
        SocketListener = require '../lib/socket_listener'
        AlarmCollection = require 'collections/alarms'

        @router = new Router()

        @alarms = new AlarmCollection()
        SocketListener.watch @alarms

        Backbone.history.start()

        Object.freeze this if typeof Object.freeze is 'function'