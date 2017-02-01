
Modal = require '../lib/modal'
H = Helpers = require '../helpers'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false

    initialize: ->
        defaultCalendarName = t 'default calendar name'
        @set 'tags', [defaultCalendarName] unless @get('tags')?.length

        @on 'change:' + @startDateField, => @startDateChanged = true
        @on 'change:attendees', => @attendeesChanged = true


    # Return the Tag object of the calendar tag of this.
    getCalendar: ->
        # TODO : Should not call app in a model, quick fix.
        return @calendar or app.calendars.getByName @get('tags')?[0]

    setCalendar: (calendar) ->
        # we clone the source array, otherwise it's not considered as changed
        # because it changes the model's attributes
        oldTags = @get 'tags'
        tags = if oldTags? then [].concat(oldTags) else []
        tags[0] = calendar.get 'name'

        @calendar = calendar

        @set tags: tags

    getDefaultColor: -> 'grey'
    getColor: ->
        calendarObject = @getCalendar()
        if calendarObject
            return calendarObject.get 'color'
        else
            return @getDefaultColor()

    isVisible: ->
        return @getCalendar()?.get 'visible'

    isAllDay: ->
        @get(@startDateField)?.length is 10

    # Returns a boolean, true if the start day and the end day are the same ones
    # Compares endDate to startDate, and takes care of all-day-long event, in
    # which case event ends at least one day after begin.
    #
    # @see https://tools.ietf.org/html/rfc5545#section-3.3.9
    isSameDay: ->
        endDate = if @isAllDay() then @getEndDateObject().add -1, 'd' else \
                                      @getEndDateObject()
        endDate.isSame @getStartDateObject(), 'day'

    # Return true if the events is running on more than one day.
    isMultipleDays: ->
        startDate = @getStartDateObject()
        endDate = @getEndDateObject()

        difference = endDate.diff(startDate, 'days', true)
        return difference > 1

    # Convert the date string from cozy, to moment with cozy's timezone.
    _toDateObject: (modelDateStr) ->
        if @isAllDay()
            return moment.tz modelDateStr, 'UTC'

        # convert to the cozy's timezone
        return H.toTimezonedMoment modelDateStr


    getDateObject: ->
        return @_toDateObject @get @startDateField

    getStartDateObject: -> @getDateObject()
    getEndDateObject: ->
        if @endDateField
            @_toDateObject @get @endDateField
        else
            @getDateObject().add 30, 'm'

    # Format a moment to the string format of the model.
    _formatMoment: (momentDate) ->
        if @isAllDay()
            formattedDate = Helpers.momentToDateString(momentDate)

        else if @isRecurrent()
            formattedDate = Helpers.momentToAmbiguousString(momentDate)

        else
            formattedDate = momentDate.toISOString()

        return formattedDate


    addToStart: (duration) ->
        @set @startDateField, @_formatMoment @getStartDateObject().add duration

    addToEnd: (duration) ->
        @set @endDateField, @_formatMoment @getEndDateObject().add duration


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
        # temporary workaround for https://github.com/cozy/cozy-calendar/issues/543
        # if rrule starts with ";", we won't be able to parse it and the application
        # will crash, so we don't mark the event as recurrent if we are unable to
        # parse the rrule
        return @has('rrule') and @get('rrule') isnt '' and not /^;/.test(@get('rrule'))

    # Compute list of fullcalendar event objects, that this recurring event
    # generate between start and end.
    # Expect that start and end are fullcalendar's moment objects.
    # getRecurrentFCEventBetween: (start, end) ->
    generateRecurrentInstancesBetween: (start, end, generator) ->
        events = []
        # skip errors
        return events if not @isRecurrent()

        # Prepare datetimes.

        # bounds.
        jsDateBoundS = start.toDate()
        jsDateBoundE = end.toDate()

        if @isAllDay()
            # For allday event, we expect that event occur on the good day in
            # local time.
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
            isoDate = jsDateRecurrentS.toISOString()
            mDateRecurrentS = moment.tz isoDate, eventTimezone

            # Fix DST troubles :
            # The hour of the recurring event is fixed in its timezone.
            # So we use it as reference.
            diff = mDateEventS.hour() - mDateRecurrentS.hour()
            # Correction is -1, 1 or 0.
            if diff is 23
                diff = -1
            else if diff is -23
                diff = 1

            mDateRecurrentS.add diff, 'hour'

            return mDateRecurrentS


        fces = rrule.between jsDateBoundS, jsDateBoundE
            .map (jsDateRecurrentS) =>

                fixedDate = fixDSTTroubles jsDateRecurrentS
                mDateRecurrentS = H.toTimezonedMoment fixedDate

                # Compute event.end as event.start + event.duration.
                mDateRecurrentE = mDateRecurrentS.clone()
                    .add mDateEventE.diff(mDateEventS, 'seconds'), 'seconds'
                fce = generator @, mDateRecurrentS, mDateRecurrentE
                return fce

        return fces

    getRecurrentFCEventBetween: (start, end) ->
        @generateRecurrentInstancesBetween start, end, (event, start, end) ->
            return event._toFullCalendarEvent start, end

    isInRange: (start, end) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        return ((sdo.isAfter(start) and sdo.isBefore(end)) or \
               (edo.isAfter(start) and edo.isBefore(end)) or \
               (sdo.isBefore(start) and edo.isAfter(end)))

    getLastOccurenceDate: ->
        if @isRecurrent()
            options = RRule.parseString @get 'rrule'
            if options.until?
                return moment options.until
            else
                # arbitrary big value
                return moment().add 10, 'years'
        else
            return @getStartDateObject()

    # Generate one event per day for multiple-days event.
    generateMultipleDaysEvents: ->
        #"start":"2015-07-04","end":"2015-07-05"

        # Return this model if the event is single-day.
        unless @isMultipleDays()
            return [@]

        # Generate one event per day if it's a multiple-days event.
        else
            startDate = @getStartDateObject()
            endDate = @getEndDateObject()

            # Compute the difference to know how many events to create.
            difference = endDate.diff(startDate, 'days')

            # If event is all day, the end date is next day
            if @isAllDay()
                difference--

            # Create one all-day event for each day.
            fakeEvents = []
            for i in [0..difference] by 1
                fakeEvent = _.clone @attributes

                # Make up a date for the i-th day.
                date = moment(startDate).add(i, 'days')
                fakeEvent =
                    start: if i is 0 then startDate else date.startOf 'day'
                    end: if i is difference then endDate else date.endOf 'day'
                    isAllDay: i not in [0, difference]
                    counter:
                        current: i + 1
                        total: difference + 1
                fakeEvents.push fakeEvent

            return fakeEvents



    toPunctualFullCalendarEvent : ->
        return @_toFullCalendarEvent @getStartDateObject(), @getEndDateObject()

    _toFullCalendarEvent: (start, end) ->

        # Time is not displayed if the event lasts all day
        if @isAllDay()
            displayedTime = ""

        # Recurring event should be displayed without the timezone taken into
        # account.
        #else if @isRecurrent()
            # .utc() changes the `start` object, so it's cloned to prevent side
            # effects.
            # displayedTime = moment(start).utc().format('H:mm')

        # Otherwise time is displayed, and timezoned (.format applies timezone)
        else
            displayedTime = start.format 'H:mm'


        description = @get 'description'
        description = description or t 'no description'
        return fcEvent =
            id: @cid
            title:  "#{displayedTime} #{description}"
            start: start
            end: end
            allDay: @isAllDay()
            startEditable: not @isRecurrent() # disable dragNdrop
            durationEditable: true
            diff: @get 'diff'
            place: @get 'place'
            timezone: @get 'timezone'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()



