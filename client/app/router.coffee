app = require 'application'
ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
AlarmCollection = require 'collections/alarms'

module.exports = class Router extends Backbone.Router

    routes:
        ''                    : 'calendar'
        'calendar'            : 'calendar'
        'list'                : 'alarmsList'

    calendar: ->
        @displayView CalendarView, app.alarms, app.events
        @handleFetch()

    alarmsList: ->
        @displayView ListView, app.alarms, app.events
        @handleFetch()

    handleFetch: ->

        unless app.alarms.length > 0
            @mainView.modelAlarm.fetch
                success: (collection, response, options) ->
                    console.log "Fetch: success"
                error: ->
                    console.log "Fetch: error"
        else
            @mainView.modelAlarm.reset app.alarms.toJSON()

        unless app.events.length > 0
            @mainView.modelEvent.fetch
                success: (collection, response, options) ->
                    console.log collection
                    console.log "Fetch: success"
                error: ->
                    console.log "Fetch: error"
        else
            @mainView.modelEvent.reset app.events.toJSON() 

    # display a page properly (remove previous page)
    displayView: (classView, alarmsCollection, eventsCollection) =>
        @mainView.remove() if @mainView

        container = $(document.createElement('div'))
        container.prop 'id', 'viewContainer'
        $('body').prepend(container)
        @mainView = new classView alarmsCollection, eventsCollection
        @mainView.render()