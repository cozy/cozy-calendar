# Realevents are events that occurs in real world.
# ie, where each instance of recurring events are a RealEvent.

module.exports = class RealEvent extends Backbone.Model
    # TODO : re-think class hierarchy, or way to construct this object.
    constructor: (options) ->
        super

        @event = options.event
        @start = options.start
        @end = options.end
        @counter = options.counter
        @forceAllDay = options.isAllDay

        if @event.isRecurrent()
            @set 'id', @event.get('id') + @start.toISOString()

        else if @event.isMultipleDays()
            @set 'id', "#{@event.get('id')} #{@start}"

        else
            @set 'id', @event.get('id')
            @start = @event.getStartDateObject()
            @end = @event.getEndDateObject()


    getCalendar: -> @event.getCalendar()
    getColor: -> @event.getColor()
    getDateHash: ->
        return @start?.format 'YYYYMMDD'

    isAllDay: -> @event.isAllDay() or @forceAllDay

    getFormattedStartDate: (format) ->
        return @start?.format format
    getFormattedEndDate: (format) ->
        return @end?.format format
