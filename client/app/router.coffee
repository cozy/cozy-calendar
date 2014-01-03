app = require 'application'
ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
EventModal = require 'views/event_modal'
ImportView = require 'views/import_view'
SyncView = require 'views/sync_view'
DayBucketCollection = require 'collections/daybuckets'

module.exports = class Router extends Backbone.Router

    routes:
        ''                     : -> @navigate 'calendar', true
        'calendar'             : 'calendar'
        'calendarweek'         : 'calendarweek'
        'list'                 : 'list'
        'sync'                 : 'sync'
        'calendar/:eventid'    : 'calendar_event'
        'calendarweek/:eventid': 'calendarweek_event'
        'list/:eventid'        : 'list_event'
        'import'               : 'import'

    calendar: (fcView = 'month') ->
        @displayView new CalendarView
            view: fcView
            model: {alarms:app.alarms, events:app.events}
        app.menu.activate 'calendar'
        @handleFetch app.alarms, 'alarms'
        @handleFetch app.events, 'events'

    calendarweek: ->
        @calendar 'agendaWeek'

    list: ->
        @displayView new ListView
            collection: new DayBucketCollection()
        app.menu.activate 'list'

    sync: ->
        @displayView new SyncView
        app.menu.activate 'sync'

    calendar_event: (id) ->
        @calendar() unless @mainView instanceof CalendarView
        @event id, 'calendar'

    calendarweek_event: (id) ->
        @calendarweek() unless @mainView instanceof CalendarView
        @event id, 'calendarweek'

    list_event: (id) ->
        @list() unless @mainView instanceof ListView
        @event id, 'list'

    event: (id, backurl) ->
        model = app.events.get(id) or new Event(id: id).fetch()
        view = new EventModal(model: model, backurl: backurl)
        $('body').append view.$el
        view.render()

    import: ->
        @displayView new ImportView()
        app.menu.activate 'import'

    handleFetch: (collection, name) ->
        unless app[name].length > 0
            collection.fetch
                success: (collection, response, options) ->
                    # console.log collection
                    # console.log "Fetch: success"
                error: ->
                    # console.log "Fetch: error"
        else
            collection.reset app[name].toJSON()

    # display a page properly (remove previous page)
    displayView: (view) =>
        @mainView.remove() if @mainView
        @mainView = view
        $('.main-container').append @mainView.$el
        @mainView.render()
