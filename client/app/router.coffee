app = require 'application'
ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
EventModal = require 'views/event_modal'
SettingsModal = require 'views/settings_modal'
ImportView = require 'views/import_view'
# RealEventCollection = require 'collections/realevents'
DayBucketCollection = require 'collections/daybuckets'

module.exports = class Router extends Backbone.Router

    routes:
        ''                                : 'month'
        'month'                           : 'month'
        'month/:year/:month'              : 'month'
        'week'                            : 'week'
        'week/:year/:month/:day'          : 'week'
        'list'                            : 'list'
        'event/:eventid'                  : 'auto_event'
        'month/:year/:month/:eventid'     : 'month_event'
        'week/:year/:month/:day/:eventid' : 'week_event'
        'list/:eventid'                   : 'list_event'
        'calendar'                        : 'backToCalendar'
        'settings'                        : 'settings'

    initialize: (options) ->
        super options

        # Only listview on mobile devices.
        $(window).resize =>
            if window.app.isMobile()
                @navigate 'list', trigger:true

    navigate: (route, options) ->
        # Only listview on mobile devices.
        if window.app.isMobile()
            super 'list', options
        else
            super route, options

    month: (year, month) ->
        if year?
            @displayCalendar 'month', year, month, 1
        else
            hash = moment().format('[month]/YYYY/M')
            @navigate hash, trigger: true

    week: (year, month, day) ->
        if year?
            [year, month, day] = getBeginningOfWeek year, month, day
            @displayCalendar 'agendaWeek', year, month, day
        else
            hash = moment().format('[week]/YYYY/M/D')
            @navigate hash, trigger: true

    list: ->
        @displayView new ListView
            collection: new DayBucketCollection()
        app.menu.activate 'calendar'
        @onCalendar = true


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

    week_event: (year, month, date, id) ->
        [year, month, day] = getBeginningOfWeek year, month, day
        @week(year, month, date) unless @mainView instanceof CalendarView
        @event id, "week/#{year}/#{month}/#{date}"

    list_event: (id) ->
        @list() unless @mainView instanceof ListView
        @event id, 'list'

    event: (id, backurl) ->
        model = app.events.get(id)
        view = new EventModal(model: model, backurl: backurl)
        $('body').append view.$el
        view.render()
        @onCalendar = true

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
            model: events: app.events

        app.menu.activate 'calendar'
        @onCalendar = true

    # display a page properly (remove previous page)
    displayView: (view) =>
        @mainView.remove() if @mainView
        @mainView = view
        $('.main-container').append @mainView.$el
        @mainView.render()

    getBeginningOfWeek = (year, month, day) ->
        [year, month, day] = [year, month, day].map (x) -> parseInt x
        monday = new Date(year, (month-1)%12, day)
        monday.setDate(monday.getDate() - monday.getDay() + 1)
        return [year, monday.getMonth()+1, monday.getDate()]


    settings: ->
        view = new SettingsModal()
        $('body').append view.$el
        view.render()
        @onCalendar = true

