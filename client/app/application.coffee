module.exports =

    initialize: ->
        Router = require 'router'
        SocketListener = require '../lib/socket_listener'
        AlarmCollection = require 'collections/alarms'
        EventCollection = require 'collections/events'

        @router = new Router()

        @alarms = new AlarmCollection()
        @events = new EventCollection() 

        SocketListener.watch @alarms
        SocketListener.watch @events

        Backbone.history.start()

        Object.freeze this if typeof Object.freeze is 'function'