app = require 'application'
ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
EventModal = require 'views/event_modal'
ImportView = require 'views/import_view'
AlarmCollection = require 'collections/alarms'

module.exports = class Router extends Backbone.Router

    routes:
        ''                    : -> @navigate 'calendar', true
        'calendar'            : 'calendar'
        'calendarweek'        : 'calendarweek'
        'events/:eventid'     : 'event'
        'alarms'              : 'alarmsList'
        'import'              : 'import'

    calendar: (fcView = 'month') ->
        console.log arguments
        @displayView new CalendarView
            view: fcView
            model: {alarms:app.alarms, events:app.events}
        @handleFetch app.alarms, "alarms"
        @handleFetch app.events, "events"

    calendarweek: ->
        @calendar 'agendaWeek'

    alarmsList: ->
        @displayView new ListView
            collection: app.alarms
        @handleFetch @mainView.collection, "alarms"

    event: (id) ->
        @calendar() unless @mainView instanceof CalendarView
        model = app.events.get(id) or new Event(id: id).fetch()
        view = new EventModal(model: model)
        $('body').append view.$el
        view.render()

    import: ->
        @displayView ImportView, app.alarms

    handleFetch: (collection, name) ->
        unless app[name].length > 0
            collection.fetch
                success: (collection, response, options) ->
                    console.log collection
                    console.log "Fetch: success"
                error: ->
                    console.log "Fetch: error"
        else
            collection.reset app[name].toJSON()

    # display a page properly (remove previous page)
    displayView: (view) =>
        @mainView.remove() if @mainView
        @mainView = view
        $('body').append @mainView.$el
        @mainView.render()
