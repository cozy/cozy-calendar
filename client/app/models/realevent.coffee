# Realevents are events that occurs in real world.
# ie, where each instance of recurring events are a RealEvent.

module.exports = class RealEvent extends Backbone.Model
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
    getColor: -> @event.getColor()
    getDateHash: ->
        return @start.format 'YYYYMMDD'

    isAllDay: -> @event.isAllDay()

    getFormattedStartDate: (format) ->
        return @start.format format
    getFormattedEndDate: (format) ->
        return @end.format format
