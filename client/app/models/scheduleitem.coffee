colorHash = require 'lib/colorhash'
H = require '../helpers'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false

    initialize: ->
        # console.log "initialize"
        @set 'tags', ['my calendar'] unless @get('tags')?.length

    getCalendar: -> @get('tags')?[0]

    getDefaultColor: -> 'grey'
    getColor: ->
        tag = @getCalendar()
        return @getDefaultColor() if not tag
        return colorHash tag

    isAllDay: ->
        @get(@startDateField)?.length is 10

    # Convert the date string from cozy, to moment with cozy's timezone.
    _toDateObject: (modelDateStr) ->
        if @isRecurrent()
            # Parse with the event timezone
            modelDateStr = moment.tz modelDateStr, @get 'timezone'

        # convert to the cozy's timezone
        return H.toTimezonedMoment modelDateStr

        # if @isAllDay @TODO : is it necessary ?
            # return moment.tz @get fieldName, 'UTC'

    getDateObject: ->
        return @_toDateObject @get @startDateField
        
    getStartDateObject: -> @getDateObject()
    getEndDateObject: ->
        if @endDateField
            @_toDateObject @get @endDateField
        else
            @getDateObject().add('m', 30)
    
    # Format a moment to the string format of the model.
    _formatMoment: (m) ->
        if @isAllDay()
            s = H.momentToDateString(m)

        else if @isRecurrent()
            s = H.momentToAmbiguousString(m)

        else
            s = m.toISOString()

        return s

    addToStart: (duration) ->
        console.log @get @startDateField
        console.log @getStartDateObject
        console.log @getStartDateObject().add(duration)
        console.log @_formatMoment(@getStartDateObject().add(duration))
        @set @startDateField, @_formatMoment(@getStartDateObject().add(duration))
        
    addToEnd: (duration) ->
        @set @endDateField, @_formatMoment(@getEndDateObject().add(duration))


    getFormattedDate: (formatter) -> @getDateObject().format formatter
    getFormattedStartDate: (formatter) -> @getStartDateObject().format formatter
    getFormattedEndDate: (formatter) -> @getEndDateObject().format formatter


    getDateHash: -> @getDateObject().format 'YYYYMMDD'

    getPreviousDateObject: ->
        previous = @previous @startDateField
        if previous?
            return @_toDateObject previous
        else 
            return false
    
    getPreviousDateHash: ->
        previous = @getPreviousDateObject()
        if previous?
            return previous.format 'YYYYMMDD'
        else 
            return false

    isRecurrent: ->
        return @has('rrule') and @get('rrule') isnt ''

    # Compute list of fullcalendar event objects, that this recurring event 
    # generate between start and end.
    # Expect that start and end are fullcalendar's moment objects.
    getRecurrentFCEventBetween: (start, end) ->
        events = []
        # skip errors
        return events if not @isRecurrent()

        # Prepare datetimes.

        # bounds.
        jsDateBoundS = start.toDate()
        jsDateBoundE = end.toDate()

        if @isAllDay()
            # For allday event, we expect that event occur on the good day in local time.
            eventTimezone = window.app.timezone
        else
            eventTimezone = @get 'timezone'

        mDateEventS = moment.tz @get(@startDateField), eventTimezone
        mDateEventE = moment.tz @get(@endDateField), eventTimezone

        jsDateEventS = new Date mDateEventS.toISOString()
    
        options = RRule.parseString @get 'rrule'
        options.dtstart = jsDateEventS

        rrule = new RRule options

        # RRule generate event with browser's timezone. But DST changing day
        # may be different between browser's timezone, and eventTimezone, which
        # may shift event from one hour. This function do that fix.
        fixDSTTroubles = (jsDateRecurrentS) ->
            # jsDateRecurrentS.toISOString is the UTC start date of the event.
            # unless, DST of browser's timezone is different from event's 
            # timezone.
            mDateRecurrentS = moment.tz(jsDateRecurrentS.toISOString(), eventTimezone)

            # Fix DST troubles :
            # The hour of the recurring event is fixed in its timezone. 
            # So we use it as reference.
            diff = mDateEventS.hour() - mDateRecurrentS.hour()
            # Correction is -1, 1 or 0.
            if diff is 23
                diff = -1
            else if diff is -23
                diff = 1

            mDateRecurrentS.add 'hour', diff 

            return mDateRecurrentS


        fces = rrule.between jsDateBoundS, jsDateBoundE
                .map (jsDateRecurrentS) =>

            mDateRecurrentS = H.toTimezonedMoment fixDSTTroubles jsDateRecurrentS
            
            # Compute event.end as event.start + event.duration.
            mDateRecurrentE = mDateRecurrentS.clone()
                .add 'seconds', mDateEventE.diff(mDateEventS, 'seconds')
            
            fce = @_toFullCalendarEvent mDateRecurrentS, mDateRecurrentE
            return fce

        return fces

    # @TODO Deprecated and usued ?
    # isOneDay: -> 
    #     # 20140904 TODO !
    #     # @startDateObject.short() is @endDateObject.short()
    #     return false

    isInRange: (start, end) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        return ((sdo.isAfter(start) and sdo.isBefore(end)) or (edo.isAfter(start) and edo.isBefore(end)) or (sdo.isBefore(start) and edo.isAfter(end)))

    toPunctualFullCalendarEvent : ->
        return @_toFullCalendarEvent @getStartDateObject(), @getEndDateObject()

    _toFullCalendarEvent: (start, end) ->
        return fcEvent =
            id: @cid
            title:  (if not @isAllDay() then start.format 'H:mm[ ]' else '') + @get('description')
            start: start
            end: end
            allDay: @isAllDay()
            diff: @get 'diff' # @TODO 
            place: @get 'place'
            timezone: @get 'timezone'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()