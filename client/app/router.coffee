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
        @handleFetch("modelAlarm", "alarms")
        @handleFetch("modelEvent", "events")


    alarmsList: ->
        @displayView ListView, app.alarms, null
        @handleFetch("model", "alarms")

    handleFetch: (model, name) ->
        unless app[name].length > 0
            @mainView[model].fetch
                success: (collection, response, options) ->
                    console.log collection
                    console.log "Fetch: success"
                error: ->
                    console.log "Fetch: error"
        else
            @mainView[model].reset app[name].toJSON()

    # display a page properly (remove previous page)
    displayView: (classView, alarmsCollection, eventsCollection) =>
        @mainView.remove() if @mainView

        container = $(document.createElement('div'))
        container.prop 'id', 'viewContainer'
        $('body').prepend(container)
        if eventsCollection is null
            @mainView = new classView 
                                model: alarmsCollection
        else
            @mainView = new classView alarmsCollection, eventsCollection
        @mainView.render()