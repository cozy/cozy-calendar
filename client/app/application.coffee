module.exports =

    initialize: ->

        @locale = window.locale
        delete window.locale

        @polyglot = new Polyglot()
        try
            locales = require 'locales/'+ @locale
        catch e
            locales = require 'locales/en'

        @polyglot.extend locales
        window.t = @polyglot.t.bind @polyglot

        Router = require 'router'
        SocketListener = require '../lib/socket_listener'
        AlarmCollection = require 'collections/alarms'
        EventCollection = require 'collections/events'

        @router = new Router()

        @alarms = new AlarmCollection()
        @events = new EventCollection() 

        SocketListener.watch @alarms
        SocketListener.watch @events

        if window.initalarms?
            @alarms.reset window.initalarms
            delete window.initalarms
            Backbone.history.start()
        else
            @alarms.fetch().done -> Backbone.history.start()

        Object.freeze this if typeof Object.freeze is 'function'