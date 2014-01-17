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
        Header = require 'views/calendar_header'
        SocketListener = require '../lib/socket_listener'
        AlarmCollection = require 'collections/alarms'
        EventCollection = require 'collections/events'
        ContactCollection = require 'collections/contacts'
        TagsCollection = require 'collections/tags'

        @alarms = new AlarmCollection()
        @events = new EventCollection()
        @contacts = new ContactCollection()
        @tags = new TagsCollection()

        @router = new Router()
        @menu = new Menu(collection: @tags)
        @menu.render().$el.prependTo 'body'

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
