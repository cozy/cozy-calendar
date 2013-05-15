app = require 'application'
ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
AlarmCollection = require 'collections/alarms'

module.exports = class Router extends Backbone.Router

    routes:
        ''                    : 'calendar'
        'calendar'            : 'calendar'
        'alarms'              : 'alarmsList'

    calendar: ->
        console.log 'route:calendar'
        @displayView CalendarView, app.alarms

        @handleFetch()

    alarmsList: ->
        console.log 'route:alarmsList'
        @displayView ListView, app.alarms
        @handleFetch()

    handleFetch: ->

        unless app.alarms.length > 0
            @mainView.model.fetch
                success: (collection, response, options) ->
                    console.log "Fetch: success"
                error: ->
                    console.log "Fetch: error"
        else
            @mainView.model.reset app.alarms.toJSON()


    # display a page properly (remove previous page)
    displayView: (classView, collection) =>
        @mainView.remove() if @mainView

        container = $(document.createElement('div'))
        container.prop 'id', 'viewContainer'
        $('body').prepend(container)
        @mainView = new classView
                            model: collection
        @mainView.render()