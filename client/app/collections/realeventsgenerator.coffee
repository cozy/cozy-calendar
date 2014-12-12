RealEvent = require '../models/realevent'

module.exports = class RealEventGeneratorCollection extends Backbone.Collection
    model = RealEvent
    comparator: (re1, re2) ->
        return re1.start.isBefore re2.start

    initialize: ->

        @baseCollection = app.events

        @listenTo @baseCollection, 'add', @resetFromBase
        @listenTo @baseCollection, 'change:start', @resetFromBase
        @listenTo @baseCollection, 'remove', @resetFromBase
        @listenTo @baseCollection, 'reset', @resetFromBase

    resetFromBase: ->
        @reset []
        @trigger 'reset'

    generateRealEvents: (start, end, callback) ->
        callback = callback or ->
        eventsInRange = []
        @baseCollection.each (item) =>

            calendar = item.getCalendar()
            return null if calendar and calendar.get('visible') is false

            if item.isRecurrent()
                evs = item.generateRecurrentInstancesBetween start, end, \
                (event, s, e) ->
                    return new RealEvent event, s, e
                eventsInRange = eventsInRange.concat evs

            else if item.isInRange start, end
                eventsInRange.push new RealEvent item

        @add eventsInRange
        callback eventsInRange

    # Try to load (generate) at least 'count' events, 
    # in the future or the past (forward)
    _loadEventsCount: (eventCount, forward, callback) ->
        count = 0
        start = @at(if forward then @length - 1 else 0)?.start
        start = if start then start.clone() else moment()
        boundary = start.clone().add (if forward then 1 else -1), 'years'

        async.whilst (
            ->
                if count > eventCount
                    return false

                else if forward
                    return start.isBefore boundary
                else 
                    return start.isAfter boundary
            ),
            ((cb) =>
                if forward
                    periodStart = start.clone()
                    periodEnd = start.add 1, 'month'
                else
                    periodEnd = start.clone()
                    periodStart = start.add -1, 'month'

                @generateRealEvents periodStart, periodEnd, (events) ->
                    count += events.length
                    cb()
            ),
            (err) ->
                callback err

    loadNextPage: (callback) ->
        callback = callback or ->
        @_loadEventsCount 10, true, callback

    loadPreviousPage: (callback) ->
        callback = callback or ->
        @_loadEventsCount 10, false, callback
