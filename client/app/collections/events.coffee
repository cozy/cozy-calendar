ScheduleItemsCollection = require './scheduleitems'
Event = require '../models/event'
request = require 'lib/request'

module.exports = class EventCollection extends ScheduleItemsCollection

    model: Event
    url: 'events'


    # Check if given month is already. If not, request the server to retrieve
    # events occuring that month.
    loadMonth: (monthToLoad, callback) ->
        monthKey = monthToLoad.format 'YYYY-MM'
        unless window.app.mainStore.loadedMonths[monthKey]
            year = monthToLoad.format 'YYYY'
            month = monthToLoad.format 'MM'
            request.get "events/#{year}/#{month}", (err, events) =>
                @add events,
                    silent: true
                    sort: false
                @trigger 'change'
                window.app.mainStore.loadedMonths[monthKey] = true
                callback()
        else
            callback()

