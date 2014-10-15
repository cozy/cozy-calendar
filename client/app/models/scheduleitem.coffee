colorHash = require 'lib/colorhash'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false
    allDay : false

    initialize: ->
        # console.log "initialize"
        @set 'tags', ['my calendar'] unless @get('tags')?.length

        @updateAttributes()

        # @TODO : actualy luckily do the job, how to be sure that @updateAttributes is called before
        # others listeners, which may depend on updaetAttributes work ?
        @on 'change', @updateAttributes, @

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

    # Update compute instance attribute such as allDay
    updateAttributes: =>
        @allDay = @get(@startDateField)?.length is 10

    getCalendar: -> @get('tags')?[0]

    getDefaultColor: -> 'grey'
    getColor: ->
        tag = @getCalendar()
        return @getDefaultColor() if not tag
        return colorHash tag

    #Deprecated, to remove.
    _toTimezonedMoment: (utcDateStr) -> moment.tz utcDateStr, window.app.timezone

    # @TODO : to check, seems wrong : why ambiguous, why cozy timezone, ...
    getDateObject: -> #@startDateObject
        ScheduleItem.ambiguousToTimezoned @get @startDateField

    getStartDateObject: -> @getDateObject()
    getEndDateObject: -> 
        if @endDateField
             ScheduleItem.ambiguousToTimezoned @get @endDateField
        else
            @getDateObject().add('m', 30)
    
    _formatMoment: (m) ->
        if @allDay
            s = ScheduleItem.momentToDateString(m)

        else if @isRecurrent()
            s = ScheduleItem.momentToAmbiguousString(m)

        else
            s = m.toISOString()

        return s

    addToStart: (duration) ->
        @set @startDateField, @_formatMoment(@getStartDateObject().add(duration))
        
    addToEnd: (duration) ->
        @set @endDateField, @_formatMoment(@getEndDateObject().add(duration))


    getFormattedDate: (formatter) -> @getDateObject().format formatter
    getFormattedStartDate: (formatter) -> @getStartDateObject().format formatter
    getFormattedEndDate: (formatter) -> @getEndDateObject().format formatter


    getDateHash: -> @getDateObject().format('YYYYMMDD')

    getPreviousDateObject: ->
        previous = @previous @startDateField
        if previous?
            return @_toTimezonedMoment(previous) 
        else 
            return false
    
    getPreviousDateHash: ->
        previous = @getPreviousDateObject()
        if previous?
            return previous.format('YYYYMMDD') 
        else 
            return false

    # Deprecated
    # # TODO:  Hide RRule object as it send wrong dates.
    # getRRuleObject: ->
    #     try
    #         options = RRule.parseString @get 'rrule'
    #         options.dtstart = @getStartDateObject()
    #         return new RRule options
    #     catch e then return false

    isRecurrent: ->
        return @has('rrule') and @get('rrule') != ''

    getRecurrentFCEventBetween: (start, end) ->
        # start ; end : should be dates !

        events = []
        # skip errors
        return events if not @isRecurrent()

        # Prepare datetimes.

        # bounds.
        jsDateBoundS = start.toDate()
        jsDateBoundE = end.toDate()

        if @allDay
            # For allday event, we expect that event occur on the good day in local time.
            eventTimezone = window.app.timezone
        else
            eventTimezone = @get 'timezone'

        mDateEventS = moment.tz(@get(@startDateField), eventTimezone)
        mDateEventE = moment.tz(@get(@endDateField), eventTimezone)

        jsDateEventS = new Date(mDateEventS.toISOString())
    

        # rruleStr = RRule.parseString @get 'rrule'
        # rruleStr += ';DTSTART=' + mDateEventS.format('YYYYMMDD[T]HHmmss[Z]')
        # options = RRule.parseString rruleStr
        options = RRule.parseString @get 'rrule'

        # options = RRule.parseString "FREQ=WEEKLY;DTSTART=20140910T080000Z;INTERVAL=1;BYDAY=WE"
        options.dtstart = jsDateEventS

        # RRule lib needs explicit Weekday with weekly interval.
        # if options.freq == RRule.WEEKLY and not options.byweekday
        #     options.byweekday = [[RRule.SU, RRule.MO, RRule.TU, RRule.WE,
        #     RRule.TH, RRule.FR, RRule.SA][mDateEventS.day()]]

        console.log options

        rrule = new RRule options


        fixDSTTroubles = (jsDateRecurrentS) ->
            # jsDateRecurrentS.toISOString is the UTC start date of the event.
            # unless, DST of browser's timezone is different from event's timezone.

            mDateRecurrentS = moment.tz(jsDateRecurrentS.toISOString(), eventTimezone)

            # Fix DST troubles :
            # Correction is -1, 1 or 0.
            diff = mDateEventS.hour() - mDateRecurrentS.hour()
            if diff == 23
                diff = -1
            else if diff == -23
                diff = 1

            mDateRecurrentS.add('hour', diff)
            return mDateRecurrentS


        fces = rrule.between(jsDateBoundS, jsDateBoundE).map (jsDateRecurrentS) =>
            mDateRecurrentS = fixDSTTroubles(jsDateRecurrentS)
            mDateRecurrentS = @_toTimezonedMoment(mDateRecurrentS)
            # mDateRecurrentS.tz(window.app.timezone)
            # Create FCEvent
            mDateRecurrentE = mDateRecurrentS.clone().add('seconds', 
                mDateEventE.diff(mDateEventS, 'seconds'))
            
            fce = @_toFullCalendarEvent(mDateRecurrentS, mDateRecurrentE)
            return fce

        return fces


    isOneDay: -> 
        # 20140904 TODO !
        # @startDateObject.short() is @endDateObject.short()
        return false

    isInRange: (start, end) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        return ((sdo.isAfter(start) and sdo.isBefore(end)) or (edo.isAfter(start) and edo.isBefore(end)) or (sdo.isBefore(start) and edo.isAfter(end)))

    # transform a SI into a FC event
    # allow overriding the startDate for recurrence management

    toPunctualFullCalendarEvent : ->
        console.log @getEndDateObject()
        return @_toFullCalendarEvent @getStartDateObject(), @getEndDateObject()

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
            # title: "#{start.format "HH:mm"} #{@get("description")}"
            title:  (if not @allDay then start.format 'H:mm[ ]' else '') + @get('description')
            start: start
            end: end
            allDay: @allDay
            diff: @get 'diff'
            place: @get 'place'
            timezone: @get 'timezone'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()

    # # #
    # Class methods
    # # #
    @ambiguousToTimezoned: (ambigM) ->
        # Convert an ambiguously fullcalendar moment, to a timezoned moment.
        # Use Cozy's timezone as reference. Fullcalendar should use timezone = "Cozy's timezone" to be coherent.

        # TODO checks ?
        return moment.tz(ambigM, window.app.timezone)

    @momentToAmbiguousString: (m) ->
        m.format("YYYY-MM-DD[T]HH:mm:ss")

    @momentToDateString: (m) ->
        m.format('YYYY-MM-DD')

    @unitValuesToiCalDuration: (unitsValues) ->
        # Transform the unit/value object to a iCal duration string.
        # @unitsValues : { 'M': 15, 'H': 1 ...}
        s = '-P'
        for u in ['W', 'D']
            if u of unitsValues
                s += unitsValues[u] + u

        t = ''
        for u in ['H', 'M', 'S']
            if u of unitsValues
                t += unitsValues[u] + u
        

        if t
            s += 'T' + t

        console.log s
        return s

    @iCalDurationToUnitValue: (s) ->
        console.log s
        # Handle only unique units strings.
        m = s.match(/(\d+)(W|D|H|M|S)/)
        o = {}
        o[m[2]] = m[1]
        console.log o

        return o