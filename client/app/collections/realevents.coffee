Event = require '../models/event'

# Realevents are events that occurs in real world.
# ie, where each instance of recurring events are a RealEvent.

RealEvent  = class RealEvent extends Backbone.Model
    # TODO : re-think class hierarchy, or way to construct this object.
    constructor: (event, start, end) ->
        super

        @event = event

        if event.isRecurrent()
            @start = start
            @end = end
            @set 'id', event.get('id') + start.toISOString()
        else
            @set 'id', event.get 'id'
            @start = event.getStartDateObject()
            @end = event.getEndDateObject()

    getCalendar: -> @event.getCalendar()
    getDateHash: ->
        return @start.format 'YYYYMMDD'

    isAllDay: -> @event.isAllDay()

    getFormattedStartDate: (format) ->
        return @start.format format
    getFormattedEndDate: (format) ->
        return @end.format format


module.exports = class RealEventCollection extends Backbone.Collection
    model = RealEvent
    comparator: (re1, re2) ->
        return re1.start.diff(re2.start)

    initialize: ->

        @baseCollection = app.events
        @tagsCollection = app.tags

        @listenTo @baseCollection, 'add', @resetFromBase
        @listenTo @baseCollection, 'change:start', @resetFromBase
        @listenTo @baseCollection, 'remove', @resetFromBase
        @listenTo @baseCollection, 'reset', @resetFromBase

        @listenTo @tagsCollection, 'change', @resetFromBase

    resetFromBase: ->
        @reset []

    generateRealEvents: (start, end, callback) ->
        callback = callback or ->
        eventsInRange = []
        @baseCollection.each (item) =>

            tag = @tagsCollection.findWhere label: item.getCalendar()
            return null if tag and tag.get('visible') is false

            if item.isRecurrent()
                evs = item.generateRecurrentInstancesBetween start, end, \
                (event, s, e) ->
                    return new RealEvent event, s, e
                eventsInRange = eventsInRange.concat evs

            else if item.isInRange start, end
                eventsInRange.push new RealEvent item

        @add eventsInRange
        callback eventsInRange

    loadNextPage: (callback) ->
        callback = callback or ->
        last = @at(@length - 1)?.start or moment()
        @generateRealEvents moment(last), moment(last).add(1, 'month'), callback

    loadPreviousPage: (callback) ->
        callback = callback or ->
        first = @at(0)?.start or moment()
        @generateRealEvents moment(first).add(-1, 'month'),
            moment(first), callback
