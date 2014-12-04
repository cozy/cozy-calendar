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
        EventCollection = require 'collections/events'
        ContactCollection = require 'collections/contacts'
        TagsCollection = require 'collections/tags'

        @events = new EventCollection()
        @contacts = new ContactCollection()
        @tags = new TagsCollection()

        @router = new Router()
        @menu = new Menu collection: @tags
        @menu.render().$el.prependTo 'body'

        SocketListener.watch @events

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
    