module.exports =

    initialize: ->

        window.app = @

        @locale = window.locale
        delete window.locale


        @polyglot = new Polyglot()
        try
            locales = require 'locales/'+ @locale
        catch e
            locales = require 'locales/en'

        @polyglot.extend locales
        window.t = @polyglot.t.bind @polyglot
        Date.setLocale @locale

        Router = require 'router'
        Menu = require 'views/menu'
        SocketListener = require '../lib/socket_listener'
        AlarmCollection = require 'collections/alarms'
        EventCollection = require 'collections/events'
        ContactCollection = require 'collections/contacts'

        @router = new Router()
        @menu = new Menu().render()
        @menu.$el.appendTo 'body'
        $("body").append '<div class="main-container"></div>'
        @alarms = new AlarmCollection()
        @events = new EventCollection()
        @contacts = new ContactCollection()

        SocketListener.watch @alarms
        SocketListener.watch @events

        if window.initalarms?
            @alarms.reset window.initalarms
            delete window.initalarms

        if window.initevents?
            @events.reset window.initevents
            delete window.initevents

        if window.initcontacts
            @contacts.reset window.initcontacts
            delete window.initcontacts

        Backbone.history.start()

        Object.freeze this if typeof Object.freeze is 'function'
