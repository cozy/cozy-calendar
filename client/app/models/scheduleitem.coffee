colorHash = require 'lib/colorhash'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false
    @dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00"

    initialize: ->
        @set 'tags', ['my calendar'] unless @get('tags')?.length
        #@startDateObject = Date.create @get @startDateField
        console.log @get @startDateField
        @startDateObject = @_toTimezonedMoment @get @startDateField
        
        console.log @startDateObject
        # 20140904 : TODO !!
        # @on 'change:' + @startDateField, =>
        #     @previousDateObject = @startDateObject
        #     @startDateObject = Date.create @get @startDateField
        #     unless @endDateField
        #         @endDateObject = @startDateObject.clone()
        #         @endDateObject.advance minutes: 30

        if @endDateField
            @endDateObject = @_toTimezonedMoment @get @endDateField
            # @endDateObject = Date.create @get @endDateField
            # 20140904 : TODO !!
            @on 'change:' + @endDateField, =>
                @endDateObject = @endDateObject
                @endDateObject = Date.create @get @endDateField
        else
            @endDateObject = @startDateObject.clone()
            # @endDateObject.advance minutes: 30
            @endDateObject.add('m', 30)


    getCalendar: -> @get('tags')?[0]

    getDefaultColor: -> 'grey'
    getColor: ->
        tag = @getCalendar()
        return @getDefaultColor() if not tag
        return colorHash tag

    _toTimezonedMoment: (utcDateStr) -> moment.tz utcDateStr, window.app.timezone


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

    isOneDay: -> 
        # 20140904 TODO !
        # @startDateObject.short() is @endDateObject.short()
        return false

    isInRange: (start, end) ->
        return ((@startDateObject.isAfter(start) and @startDateObject.isBefore(end)) or (@endDateObject.isAfter(start) and @endDateObject.isBefore(end)) or (@startDateObject.isBefore(start) and @endDateObject.isAfter(end)))

    # transform a SI into a FC event
    # allow overriding the startDate for reccurence management
    toFullCalendarEvent: (rstart) ->
        # TODO: read that to manage recurrence.
        start = @getStartDateObject()
        end = @getEndDateObject()

        # if rstart
        #     duration = end - start
        #     end = Date.create(rstart).clone().advance duration
        #     start = rstart

        # start = @_toTimezonedMoment @get @startDateField
        # end = @_toTimezonedMoment @get @endDateField

        # console.log @get @startDateField
        # console.log @previous @startDateField
        console.log start.format()
        # console.log @_toTimezonedMoment start
        # console.log @_toTimezonedMoment @get @startDateField

        return fcEvent =
            id: @cid
            # title: "#{start.format "{HH}:{mm}"} #{@get("description")}"
            title: "#{start.format "HH:mm"} #{@get("description")}"
            # start: @get @startDateField
            start: start.format()
            # start: start.format Date.ISO8601_DATETIME
            end: end.format()
            # end: end.format Date.ISO8601_DATETIME
            allDay: false
            diff: @get "diff"
            place: @get 'place'
            timezone: @get 'timezone'
            timezoneHour: @get 'timezoneHour'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()