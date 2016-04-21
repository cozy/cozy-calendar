module.exports =

    initialize: ->

        window.app = @

        @timezone = window.timezone
        delete window.timezone

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
        SocketListener = require 'lib/socket_listener'
        TagCollection = require 'collections/tags'
        EventCollection = require 'collections/events'
        ContactCollection = require 'collections/contacts'
        CalendarsCollection = require 'collections/calendars'

        @tags = new TagCollection()
        @events = new EventCollection()
        @contacts = new ContactCollection()
        @calendars = new CalendarsCollection()

        # Main Store is used to mark which months were loaded or not.
        # That way the app knows when data fetching is required.
        @mainStore =
            loadedMonths: {}
        now = moment().startOf 'month'
        for i in [1..3]
            m1 = now.clone().subtract('months', i).format 'YYYY-MM'
            m2 = now.clone().add('months', i).format 'YYYY-MM'
            @mainStore.loadedMonths[m1] = true
            @mainStore.loadedMonths[m2] = true
        @mainStore.loadedMonths[now.format 'YYYY-MM'] = true

        isMobile = @isMobile()

        @router = new Router isMobile: isMobile
        @menu = new Menu collection: @calendars
        @menu.render().$el.prependTo 'body'

        SocketListener.watch @events
        SocketListener.watch @contacts
        #SocketListener.watch @calendars

        if window.initcalendars?
            @calendars.reset window.initcalendars
            delete window.initcalendars

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
        todayChecker = require 'lib/today_checker'
        todayChecker @router

        Object.freeze this if typeof Object.freeze is 'function'

        # Pretty dirty but I don't see any other way at this time
        if isMobile
            document.body.classList.add('is-mobile')


    isMobile: ->
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent)
