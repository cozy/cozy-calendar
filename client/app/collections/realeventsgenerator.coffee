RealEvent = require '../models/realevent'

module.exports = class RealEventGeneratorCollection extends Backbone.Collection
    model: RealEvent
    comparator: (re1, re2) ->
        return if re1.start.isBefore re2.start then -1 else 1

    initialize: ->
        @baseCollection = app.events
        @generateAllRealEvents()

        @listenTo @baseCollection, 'add', @resetFromBase
        @listenTo @baseCollection, 'change:start', @resetFromBase
        @listenTo @baseCollection, 'remove', @resetFromBase
        @listenTo @baseCollection, 'reset', @resetFromBase

        @listenTo app.calendars, 'change', => @reset []

    resetFromBase: ->
        # Make it asynchronous, as used in read-only view.
        setTimeout =>
                @generateAllRealEvents()
                @reset []
            , 0

    generateAllRealEvents: ->
        start = @baseCollection.first().getStartDateObject()
        end = @baseCollection.last().getStartDateObject()
        now = moment()

        start = if start.isBefore now then start else now
        # Add one week in past to be sur all events will be generated.
        start = start.clone().add -1, 'weeks'
        end = if end.isAfter now then end else now
        # Generate up to two weeks after the last event.
        end = end.clone().add 2, 'weeks'

        generatedEvents = []
        @baseCollection.each (item) =>
            if item.isRecurrent()
                # Let the browser take control back sometimes.
                setTimeout =>
                        evs = item.generateRecurrentInstancesBetween start, end, \
                        (event, s, e) ->
                            return new RealEvent event, s, e

                        generatedEvents = generatedEvents.concat evs
                    , 0

            else
                generatedEvents.push new RealEvent item

        @realEvents = generatedEvents.sort @comparator

    _loadEventsCount: (count, forward, callback) ->
        direction = if forward then 1 else -1
        toAdd = []

        boundary = @at if forward then @length - 1 else 0

        if boundary?
            # Find boundary index in realEvents array.
            boundaryIndex = @realEvents.indexOf boundary

            # Exclude already added boundary from slice.
            boundaryIndex += direction

        else
            # @ is still empty. Choose some item in realEvents.
            # use the closest event to now, but in the future.
            now = moment()

            i = @realEvents.length - 1
            # boundary = @realEvents[i]
            while i >= 0
                realEvent = @realEvents[i]
                if now.isAfter realEvent.start
                    boundaryIndex = i + 1
                    break
                # boundary = realEvent
                i--

        i = boundaryIndex
        while toAdd.length < count and i >= 0 and i < @realEvents.length
            realEvent = @realEvents[i]
            calendar = realEvent.getCalendar()
            if calendar and calendar.get('visible') is true
                toAdd.push realEvent

            i += direction

        @add toAdd
        callback toAdd

    # Load nexts events. Return true if new events loaded.
    loadNextPage: (callback) ->
        callback = callback or ->
        @_loadEventsCount 10, true, callback

    # Load nexts events. Return true if new events loaded.
    loadPreviousPage: (callback) ->
        callback = callback or ->
        @_loadEventsCount 10, false, callback
