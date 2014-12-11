module.exports =

    initialize: ->
        # @TODO improve that
        # Initialize timezone with the Cozy User's one.
        # Need page refresh to realod it.
        $.get "users/current?keys=timezone", (data) =>
            @timezone = data
            @_initialize()

    _initialize: ->

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

        # If needed, add locales to client/vendor/scripts/lang
        moment.locale @locale

        Router = require 'router'
        Menu = require 'views/menu'
        Header = require 'views/calendar_header'
        SocketListener = require '../lib/socket_listener'
        TagCollection = require 'collections/tags'
        EventCollection = require 'collections/events'
        ContactCollection = require 'collections/contacts'
        CalendarsCollection = require 'collections/calendars'

        @tags = new TagCollection()
        @events = new EventCollection()
        @contacts = new ContactCollection()
        @calendars = new CalendarsCollection()

        @router = new Router()
        @menu = new Menu collection: @calendars
        @menu.render().$el.prependTo 'body'

        # TODO ? SocketListener.watch @tags
        SocketListener.watch @events

        if window.inittags?
            @tags.reset window.inittags
            delete window.inittags

        if window.initevents?
            @events.reset window.initevents
            delete window.initevents

        if window.initcontacts
            @contacts.reset window.initcontacts
            delete window.initcontacts

        Backbone.history.start()

        # Starts the automatic update of 'today'
        todayChecker = require '../lib/today_checker'
        todayChecker @router

        Object.freeze this if typeof Object.freeze is 'function'
    
    isMobile: ->
        # Test agains't property changed by css @media, 
        # instead of direct windows.width .
        return $('ul#menu').height() is 40
        