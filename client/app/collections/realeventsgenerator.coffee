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

        #init @ with coming week.
        today = moment()
        @firstDate = today
        @lastDate = today.clone().add 1, 'week'

        @_initializeGenerator()


    _initializeGenerator: ->
        @previousRecuringEvents = []
        @runningRecuringEvents = []

        @firstGeneratedEvent = null
        @lastGeneratedEvent = null

        eventsInRange = []
        start = @firstDate.clone()
        end = @lastDate.clone()

        i = 0
        while i < @baseCollection.length
            item = @baseCollection.at i
            i++

            if item.getStartDateObject().isAfter end
                @lastGeneratedEvent = item
                break

            if item.isRecurrent()
                evs = item.generateRecurrentInstancesBetween start, end, \
                (event, s, e) ->
                    return new RealEvent event, s, e
                eventsInRange = eventsInRange.concat evs

                if item.getStartDateObject().isBefore start
                    @previousRecuringEvents.push item

                if item.getLastOccurenceDate().isAfter end
                    @runningRecuringEvents.push item


            else if item.isInRange start, end
                # initialize firstGeneratedEvent
                if firstGeneratedEvent is null
                    firstGeneratedEvent = item
                eventsInRange.push new RealEvent item

        @add eventsInRange

    resetFromBase: ->
        @reset []
        @_initializeGenerator()
        @trigger 'reset'



    loadNextPage: (callback) ->
        callback = callback or ->

        eventsInRange = []
        start = @lastDate.clone()
        @lastDate.add 1, 'month'
        end = @lastDate.clone()

        # pic ponctual event and store newly found recurring ones.
        i = @baseCollection.indexOf @lastGeneratedEvent
        while i >= 0 and i < @baseCollection.length
            item = @baseCollection.at i
            i++

            # End loop conditions
            if item.getStartDateObject().isAfter end
                @lastGeneratedEvent = item
                break

            else if i is @baseCollection.length
                @lastGeneratedEvent = null

            if item.isRecurrent()
                @runningRecuringEvents.push item

            else
                eventsInRange.push new RealEvent item

        # generated recurring events.
        @runningRecuringEvents.forEach (item, index) =>
            evs = item.generateRecurrentInstancesBetween start, end, \
                (event, s, e) ->
                    return new RealEvent event, s, e
                eventsInRange = eventsInRange.concat evs

            # Remove out of next scope recurring events.
            if item.getLastOccurenceDate().isBefore end
                @runningRecuringEvents.splice index, 1

        # No more events condition :
        #   @runningRecuringEvents.length is 0 and @lastGeneratedEvent is null

        @add eventsInRange

        callback()

    loadPreviousPage: (callback) ->
        callback = callback or ->

        eventsInRange = []
        end = @firstDate.clone()
        @firstDate.add -1, 'month'
        start = @firstDate.clone()

        # pick ponctual events
        i = @baseCollection.indexOf @firstGeneratedEvent
        while i >= 0
            item = @baseCollection.at i
            i--

            # End loop condition.
            if item.getStartDateObject().isBefore start
                @firstGeneratedEvent = item
                break
            else if i is 0
                @firstGeneratedEvent = null

            # pick ponctual events.
            if not item.isRecurrent()
                eventsInRange.push new RealEvent item

        # generated recurring events.
        @previousRecuringEvents.forEach (item, index) =>
            # Skip not yet in period recurring events.
            if item.getLastOccurenceDate().isBefore start
                return
            # Remove out of scope recurring events.
            if item.getStartDateObject().isAfter end
                @previousRecuringEvents.splice index, 1
                return

            # else: generate realevents
            evs = item.generateRecurrentInstancesBetween start, end, \
                (event, s, e) ->
                    return new RealEvent event, s, e
                eventsInRange = eventsInRange.concat evs

        # No more events condition :
        #   @runningRecuringEvents.length is 0 and @lastGeneratedEvent is null

        @add eventsInRange

        callback()
