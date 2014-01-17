colorHash = require 'lib/colorhash'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false
    @dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00"

    initialize: ->
        @set 'tags', ['my calendar'] unless @get('tags')?.length
        @startDateObject = Date.create @get @startDateField
        @on 'change:' + @startDateField, =>
            @previousDateObject = @startDateObject
            @startDateObject = Date.create @get @startDateField
            unless @endDateField
                @endDateObject = @startDateObject.clone()
                @endDateObject.advance minutes: 30

        if @endDateField
            @endDateObject = Date.create @get @endDateField
            @on 'change:' + @endDateField, =>
                @endDateObject = @endDateObject
                @endDateObject = Date.create @get @endDateField
        else
            @endDateObject = @startDateObject.clone()
            @endDateObject.advance minutes: 30

    getCalendar: -> @get('tags')?[0]

    getDefaultColor: -> 'grey'
    getColor: ->
        tag = @getCalendar()
        return @getDefaultColor() if not tag
        return colorHash tag

    getDateObject: -> @startDateObject
    getStartDateObject: -> @getDateObject()
    getEndDateObject: -> @endDateObject

    getFormattedDate: (formatter) -> @getDateObject().format formatter
    getFormattedStartDate: (formatter) -> @getStartDateObject().format formatter
    getFormattedEndDate: (formatter) -> @getEndDateObject().format formatter

    getDateHash: () -> @getDateObject().format '{yyyy}{MM}{dd}'
    getPreviousDateObject: ->
        previous = @previous(@startDateField)?
        if previous then Date.create previous else false
    getPreviousDateHash: ->
        previous = @getPreviousDateObject()
        if previous then previous.format('{yyyy}{MM}{dd}') else false

    getRRuleObject: ->
        try
            options = RRule.parseString @get 'rrule'
            options.dtstart = @getStartDateObject()
            return new RRule options
        catch e then return false

    isOneDay: -> @startDateObject.short() is @endDateObject.short()

    isInRange: (start, end) ->
        @startDateObject.isBetween(start, end) or
        @endDateObject.isBetween(start, end) or
        (@startDateObject.isBefore(start) and @endDateObject.isAfter(end))

    # transform a SI into a FC event
    # allow overriding the startDate for reccurence management
    toFullCalendarEvent: (rstart) ->
        start = @getStartDateObject()
        end = @getEndDateObject()

        if rstart
            duration = end - start
            end = Date.create(rstart).clone().advance duration
            start = rstart

        return fcEvent =
            id: @cid
            title: "#{start.format "{HH}:{mm}"} #{@get("description")}"
            start: start.format Date.ISO8601_DATETIME
            end: end.format Date.ISO8601_DATETIME
            allDay: false
            diff: @get "diff"
            place: @get 'place'
            timezone: @get 'timezone'
            timezoneHour: @get 'timezoneHour'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()