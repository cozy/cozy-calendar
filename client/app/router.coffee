app = require 'application'

ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
SettingsModal = require 'views/settings_modal'
ImportView = require 'views/import_view'
EventPopover = require 'views/event_popover'

# RealEventCollection = require 'collections/realevents'
DayBucketCollection = require 'collections/daybuckets'
Event = require 'models/event'

helpers = require 'helpers'


getBeginningOfWeek = (year, month, day) ->
    [year, month, day] = [year, month, day].map (x) -> parseInt x
    monday = new Date(year, (month-1)%12, day)
    monday.setDate(monday.getDate() - monday.getDay() + 1)
    return [year, monday.getMonth()+1, monday.getDate()]


module.exports = class Router extends Backbone.Router

    routes:
        ''                                : 'month'
        'month'                           : 'month'
        'month/:year/:month'              : 'month'
        'month/:year/:month/:eventid'     : 'month_event'
        'list'                            : 'list'
        'list/:eventid'                   : 'list_event'
        'event/:eventid'                  : 'auto_event'
        'calendar'                        : 'backToCalendar'
        'settings'                        : 'settings'

    initialize: (options) ->
        super options

        @isMobile = options?.isMobile

        # Only listview on mobile devices.
        $(window).resize =>
            if @isMobile
                @navigate 'list', trigger: true


    navigate: (route, options) ->
        # Only listview on mobile devices.
        if @isMobile
            super 'list', options
        else
            super route, options


    month: (year, month) ->
        if year?
            monthToLoad = moment("#{year}/#{month}", "YYYY/M")
            window.app.events.loadMonth monthToLoad, =>
                @displayCalendar 'month', year, month, 1
        else
            hash = moment().format('[month]/YYYY/M')
            @navigate hash, trigger: true


    list: ->
        @displayView new ListView
            isMobile: @isMobile,
            collection: new DayBucketCollection()

        app.menu.activate 'calendar'
        @onCalendar = true

        @mainView.on 'event:dialog', @showPopover



    auto_event: (id) ->
        model = app.events.get(id)
        unless model
            alert 'This event does not exists'
            @navigate ''
        date = model.getDateObject()
        @month_event date.getFullYear(), date.getMonth(), id


    month_event: (year, month, id) ->
        @month(year, month) unless @mainView instanceof CalendarView
        @event id, "month/#{year}/#{month}"


    list_event: (id) ->
        @list() unless @mainView instanceof ListView
        @event id, 'list'


    event: (id, backurl) ->
        # @TODO: bring back that feature in the future
        console.log 'This feature has been temporarily disabled. Let us ' + \
                     'know if you miss it!'

    backToCalendar: =>
        #@TODO, go back to same view we left
        @navigate '', true


    displayCalendar: (view, year, month, day) =>
        @lastDisplayCall = Array.apply arguments


        @displayView new CalendarView
            year: parseInt year
            month: (parseInt(month) + 11) % 12
            date: parseInt day
            view: view
            model:
                events: app.events
                # TODO : All router logic should be in app object
                pendingEventSharingsCollection: app.pendingEventSharings
            document: window.document

        @mainView.on 'event:dialog', @showPopover

        app.menu.activate 'calendar'
        @onCalendar = true


    showPopover: (options={}) =>
        # @TODO Event creation is a typical core feature of the calendar
        # app, this part should be moved directly into the app module, and
        # managed
        # with event handlers
        options.document = window.document
        options.parentView = @mainView
        options.start ?= new Date()
        options.end ?= new Date()


        # Prevent unselecting the calendar cell on popover close.
        # Not the cleanest way but as fullcalendar does not allow us to explicitly
        # set the selection without trigerring onSelect callback, we have to keep
        # a flag like this locally.
        preventUnselecting = =>
            @isUnselectPrevented = true


        onPopoverClose = =>
            @mainView.cal.fullCalendar 'unselect' unless @isUnselectPrevented
            @isUnselectPrevented = false
            @mainView.popover = null


        showNewPopover = =>
            model = options.model ?= new Event
                start: helpers.momentToString(options.start)
                end: helpers.momentToString(options.end)
                description: ''
                place: ''

            model.fetchEditability (err, editable) =>
                console.error err if err

                @mainView.popover = new EventPopover _.extend options, { readOnly: not editable }

                @mainView.popover.render()

                @listenTo @mainView.popover, 'closed', onPopoverClose


        if @mainView.popover
            # click on same case
            preventUnselecting()
            @mainView.popover.close showNewPopover

        else
            showNewPopover()


    # display a page properly (remove previous page)
    displayView: (view) =>
        @mainView.remove() if @mainView
        @mainView = view
        $('main').append @mainView.$el
        @mainView.render()


    settings: ->
        view = new SettingsModal()
        $('body').append view.$el
        view.render()
        @onCalendar = true
