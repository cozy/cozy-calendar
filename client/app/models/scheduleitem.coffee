colorHash = require 'lib/colorhash'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false
    @dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00"

    initialize: ->
        # console.log "initialize"
        @set 'tags', ['my calendar'] unless @get('tags')?.length

        # #@startDateObject = Date.create @get @startDateField
        #@startDateObject = @_toTimezonedMoment @get @startDateField
        
        # # 20140904 : TODO !!
        # # @on 'change:' + @startDateField, =>
        # #     @previousDateObject = @startDateObject
        # #     @startDateObject = Date.create @get @startDateField
        # #     unless @endDateField
        # #         @endDateObject = @startDateObject.clone()
        # #         @endDateObject.advance minutes: 30

        # if @endDateField
        #     @endDateObject = @_toTimezonedMoment @get @endDateField
        #     # @endDateObject = Date.create @get @endDateField
        #     # 20140904 : TODO !!
        #     # @on 'change:' + @endDateField, =>
        #     #     @endDateObject = @endDateObject
        #     #     @endDateObject = Date.create @get @endDateField
        # else
        #     @endDateObject = @startDateObject.clone()
        #     # @endDateObject.advance minutes: 30
        #     @endDateObject.add('m', 30)


    getCalendar: -> @get('tags')?[0]

    getDefaultColor: -> 'grey'
    getColor: ->
        tag = @getCalendar()
        return @getDefaultColor() if not tag
        return colorHash tag

    _toTimezonedMoment: (utcDateStr) -> moment.tz utcDateStr, window.app.timezone


    getDateObject: -> #@startDateObject
        return @_toTimezonedMoment @get @startDateField
    getStartDateObject: -> @getDateObject()
    getEndDateObject: -> 
        if @endDateField
             @_toTimezonedMoment @get @endDateField
        else
            @getDateObject().add('m', 30)
             


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
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        return ((sdo.isAfter(start) and sdo.isBefore(end)) or (edo.isAfter(start) and edo.isBefore(end)) or (sdo.isBefore(start) and edo.isAfter(end)))

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
        # console.log @_toTimezonedMoment start
        # console.log @_toTimezonedMoment @get @startDateField

        return fcEvent =
            id: @cid
            #title: "#{start.format "HH:mm"} #{@get("description")}"
            title: @get("description")
            # start: @get @startDateField
            start: start
            # start: start.format Date.ISO8601_DATETIME
            end: end
            # end: end.format Date.ISO8601_DATETIME
            allDay: false
            diff: @get "diff"
            place: @get 'place'
            timezone: @get 'timezone'
            timezoneHour: @get 'timezoneHour'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()

    @ambiguousToTimezoned: (ambigM) ->
        # Convert an ambiguously fullcalendar moment, to a timezoned moment.
        # Use Cozy's timezone as reference. Fullcalendar should use timezone = "Cozy's timezone" to be coherent.

        # TODO checks ?
        return moment.tz(ambigM, window.app.timezone)