app = require 'application'
ListView = require 'views/list_view'
CalendarView = require 'views/calendar_view'
ImportView = require 'views/import_view'
AlarmCollection = require 'collections/alarms'

module.exports = class Router extends Backbone.Router

    routes:
        ''                    : 'calendar'
        'calendar'            : 'calendar'
        'list'                : 'alarmsList'
        'import'              : 'import'

    calendar: ->
        @displayView CalendarView, app.alarms
        @handleFetch()

    alarmsList: ->
        @displayView ListView, app.alarms
        @handleFetch()

    import: ->
        @displayView ImportView, app.alarms

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
