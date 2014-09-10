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

    # TODO:  Hide RRule object as it send wrong dates.
    getRRuleObject: ->
        try
            options = RRule.parseString @get 'rrule'
            options.dtstart = @getStartDateObject()
            return new RRule options
        catch e then return false

    isRecurrent: ->
        console.log @get 'rrule'
        
        return @has 'rrule' and @get 'rrule'

    getRecurrentFCEventBetween: (start, end) ->
        # start ; end : should be dates !

        events = []
        # skip errors
        return events if not @isRecurrent()

        # Prepare datetimes.

        # bounds.
        jsDateBoundS = new Date start.toISOString()
        jsDateBoundE = new Date end.toISOString()

        # Stubs
        jsDateBoundS = new Date "2014-10-20"
        jsDateBoundE = new Date "2014-11-10"

        # event start :

        # mDateEventS = moment.tz(@get @startDateField, @get "timezone")
        # TODO stub for tests ! DTSTART;TZID=Europe/Paris:20111003T103000
        eventTimezone = "America/New_York" # "Europe/Paris"
        mDateEventS = moment.tz("20131210T233000", "YYYYMMDD[T]HHmmss", eventTimezone)
        mDateEventE = moment.tz("20131211T023000", "YYYYMMDD[T]HHmmss", eventTimezone)
        # mDateEventS = moment.tz("20140910T103000", eventTimezone)

        console.log mDateEventS.toISOString()

        jsDateEventS = new Date(mDateEventS.toISOString())
    

        # options = RRule.parseString @get 'rrule'
        options = RRule.parseString "FREQ=WEEKLY;DTSTART=20140910T080000Z;INTERVAL=1;BYDAY=WE"
        options.dtstart = jsDateEventS
        rrule = new RRule options


        fixDSTTroubles = (jsDateRecurrentS) ->
            # jsDateRecurrentS.toISOString is the UTC start date of the event.
            # unless, DST of browser's timezone is different from event's timezone.

            mDateRecurrentS = moment.tz(jsDateRecurrentS.toISOString(), eventTimezone)

            # console.log mDateRecurrentS

            # console.log mDateRecurrentS.hour()
            # console.log mDateRecurrentS.dayOfYear()
            # console.log mDateEventS.hour()

            # Fix DST troubles :
            # Correction is -1, 1 or 0.
            diff = mDateEventS.hour() - mDateRecurrentS.hour()
            console.log diff
            if diff == 23
                diff = -1
            else if diff == -23
                diff = 1

            mDateRecurrentS.add('hour', diff)

            # console.log mDateRecurrentS.hour()
            # console.log mDateRecurrentS.dayOfYear()
            return mDateRecurrentS


        return rrule.between(jsDateBoundS, jsDateBoundE).map (jsDateRecurrentS) =>
            mDateRecurrentS = fixDSTTroubles(jsDateRecurrentS)

            # Create FCEvent
            duration = 
            mDateRecurrentE = mDateRecurrentS.clone().add('seconds', 
                mDateEventE.diff(mDateEventS, 'seconds'))
            
            return @_toFullCalendarEvent(mDateRecurrentS, mDateRecurrentE)


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

    toPunctualFullCalendarEvent : ->
        return @_toFullCalendarEvent(@getStartDateObject(), @getEndDateObject())

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

    _toFullCalendarEvent: (start, end) ->


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