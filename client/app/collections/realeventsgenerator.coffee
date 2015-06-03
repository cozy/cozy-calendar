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

        @listenTo app.calendars, 'change', -> @resetFromBase true

        @_initializeGenerator()

    _initializeGenerator: ->
        @previousRecurringEvents = []
        @runningRecurringEvents = []

        # Default value. In the particular case of all events > today,
        # then last event is the closest to today.
        @firstGeneratedEvent = @baseCollection.at @baseCollection.length - 1
        @lastGeneratedEvent = null

        today = moment().startOf 'day'
        @firstDate = today.clone()
        @lastDate = today.clone()

        i = 0
        while i < @baseCollection.length
            item = @baseCollection.at i
            i++

            if not item.isVisible() then continue

            # break loop condition
            if item.getStartDateObject().isAfter(today)
                @firstGeneratedEvent = item
                @lastGeneratedEvent = item
                break

            if item.isRecurrent()
                @previousRecurringEvents.push item

                if item.getLastOccurenceDate().isAfter(today)
                    @runningRecurringEvents.push item

        @loadNextPage()

    resetFromBase: (sync)->
        resetProc = =>
                @reset []
                @_initializeGenerator()
                @trigger 'reset'
        if sync
            resetProc()
        else
            # Asynchronous, to avoid lag on clicks and edits.
            setTimeout resetProc, 1


    loadNextPage: (callback) ->
        callback = callback or ->

        eventsInRange = []
        start = @lastDate.clone()
        @lastDate.add 1, 'month'
        end = @lastDate.clone()
        # pick ponctual event and store newly found recurring ones.
        i = @baseCollection.indexOf @lastGeneratedEvent
        @lastGeneratedEvent = null # reset, before finding the new one.
        unless i is -1
            while i < @baseCollection.length and @lastGeneratedEvent is null
                item = @baseCollection. at i
                i++
                unless item.isVisible() then continue
                # else if item.getStartDateObject().isAfter(end)
                #     @lastGeneratedEvent = item # end loop condition
                else if item.isRecurrent()
                    @runningRecurringEvents.push item
                else
                    eventsInRange.push new RealEvent(item)

        # generated recurring events.
        @runningRecurringEvents.forEach (item, index) =>
            evs = item.generateRecurrentInstancesBetween start, end, \
                (event, instanceStart, instanceEnd) ->
                    return new RealEvent event, instanceStart, instanceEnd
                eventsInRange = eventsInRange.concat evs

            # Remove out of next scope recurring events.
            if item.getLastOccurenceDate().isBefore(end)
                @runningRecurringEvents.splice index, 1



        @add eventsInRange

        # No more events condition :
        noEventsRemaining =  @runningRecurringEvents.length is 0 and
                             @lastGeneratedEvent is null

        callback noEventsRemaining

    loadPreviousPage: (callback) ->
        callback = callback or ->

        eventsInRange = []
        end = @firstDate.clone()
        @firstDate.add -1, 'month'
        start = @firstDate.clone()

    # pick ponctual event and store newly found recurring ones.
        i = @baseCollection.indexOf @firstGeneratedEvent
        @firstGeneratedEvent = null # reset, before finding the new one.
        while i >= 0 and @firstGeneratedEvent is null
            item = @baseCollection.at i
            i--

            unless item.isVisible() then continue
            else if item.getStartDateObject().isBefore(start)
                @firstGeneratedEvent = item # end loop condition
            else unless item.isRecurrent() # pick ponctual events.
                eventsInRange.push new RealEvent item

        # generated recurring events.
        @previousRecurringEvents.forEach (item, index) =>
            # Skip not yet in period recurring events.
            if item.getLastOccurenceDate().isBefore(start)
                return
            # Remove out of scope recurring events.
            if item.getStartDateObject().isAfter(end)
                @previousRecurringEvents.splice index, 1
                return

            # else: generate realevents
            evs = item.generateRecurrentInstancesBetween start, end, \
                (event, instanceStart, instanceEnd) ->
                    return new RealEvent event, instanceStart, instanceEnd
                eventsInRange = eventsInRange.concat evs

        @add eventsInRange

        # No more events condition :
        noPreviousEventsRemaining = @previousRecurringEvents.length is 0 and
                                    @firstGeneratedEvent is null

        callback noPreviousEventsRemaining
