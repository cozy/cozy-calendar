RealEvent = require '../models/realevent'

module.exports = class RealEventGeneratorCollection extends Backbone.Collection
    model = RealEvent
    comparator: (re1, re2) ->
        return re1.start.isAfter re2.start

    initialize: ->
        @baseCollection = app.events
        @generateAllRealEvents()

        @listenTo @baseCollection, 'add', @resetFromBase
        @listenTo @baseCollection, 'change:start', @resetFromBase
        @listenTo @baseCollection, 'remove', @resetFromBase
        @listenTo @baseCollection, 'reset', @resetFromBase

    resetFromBase: ->
        @reset []
        @generateAllRealEvents()
        @trigger 'reset'

    generateAllRealEvents: ->
        start = @baseCollection.first().getStartDateObject()
        end = @baseCollection.last().getStartDateObject()
        generatedEvents = []
        @baseCollection.each (item) =>
            if item.isRecurrent()
                evs = item.generateRecurrentInstancesBetween start, end, \
                (event, s, e) ->
                    return new RealEvent event, s, e
                generatedEvents = generatedEvents.concat evs

            else
                generatedEvents.push new RealEvent item

        @realEvents = generatedEvents.sort @comparator


    # Try to load (generate) up to 'count' events, from generated realEvents,
    # in the future or the past (forward)
    _loadEventsCount: (count, forward, callback) ->
        boundary = @at if forward then @length - 1 else 0
        if not boundary
            # use the closest event to now.
            now = moment()
            @realEvents.some (realEvent) ->
                if now.isBefore realEvent.start
                    boundary = realEvent
                    return true

        if boundary
            # Take the previous N events
            boundaryIndex = @realEvents.indexOf boundary
            if forward
                startIndex = boundaryIndex
                endIndex = boundaryIndex + count

            else
                startIndex = boundaryIndex - count
                endIndex = boundaryIndex

            @add @realEvents.slice startIndex, endIndex

        callback()

    loadNextPage: (callback) ->
        callback = callback or ->
        @_loadEventsCount 10, true, callback

    loadPreviousPage: (callback) ->
        callback = callback or ->
        @_loadEventsCount 10, false, callback
