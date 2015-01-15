
Modal = require '../lib/modal'
H = require '../helpers'

module.exports = class ScheduleItem extends Backbone.Model

    fcEventType: 'unknown'
    startDateField: ''
    endDateField: false

    initialize: ->
        @set 'tags', ['my calendar'] unless @get('tags')?.length

        @on 'change:' + @startDateField, => @startDateChanged = true
        @on 'change:attendees', => @attendeesChanged = true

    # Return the Tag object of the calendar tag of this.
    getCalendar: ->
        return app.tags.getByName @get('tags')?[0]

    setCalendar: (cal) ->
        # we clone the source array, otherwise it's not considered as changed
        # because it changes the model's attributes
        oldTags = @get 'tags'
        tags = if oldTags? then [].concat(oldTags) else []
        tags[0] = cal
        @set tags: tags

    getDefaultColor: -> 'grey'
    getColor: ->
        calendarObject = @getCalendar()
        if calendarObject
            return calendarObject.get 'color'
        else
            return @getDefaultColor()

    isAllDay: ->
        @get(@startDateField)?.length is 10

    # Returns a boolean, true if the start day and the end day are the same ones
    # Compares endDate to startDate, and takes care of all-day-long event, in
    # which case event ends at least one day after begin.
    #
    # @see https://tools.ietf.org/html/rfc5545#section-3.3.9
    isSameDay: ->
        endDate = if @isAllDay() then @getEndDateObject().add -1, 'd' else
                                      @getEndDateObject()
        endDate.isSame @getStartDateObject(), 'day'

    # Convert the date string from cozy, to moment with cozy's timezone.
    _toDateObject: (modelDateStr) ->
        if @isAllDay()
            return moment.tz modelDateStr, 'UTC'

        if @isRecurrent()
            # Parse with the event timezone
            modelDateStr = moment.tz modelDateStr, @get 'timezone'

        # convert to the cozy's timezone
        return H.toTimezonedMoment modelDateStr


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
            m = moment(m).tz @get 'timezone'
            s = H.momentToAmbiguousString(m)

        else
            s = m.toISOString()

        return s

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
        return @has('rrule') and @get('rrule') isnt ''

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

            mDateRecurrentS.add 'hour', diff

            return mDateRecurrentS


        fces = rrule.between jsDateBoundS, jsDateBoundE
            .map (jsDateRecurrentS) =>

                fixedDate = fixDSTTroubles jsDateRecurrentS
                mDateRecurrentS = H.toTimezonedMoment fixedDate

                # Compute event.end as event.start + event.duration.
                mDateRecurrentE = mDateRecurrentS.clone()
                    .add 'seconds', mDateEventE.diff(mDateEventS, 'seconds')
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

    toPunctualFullCalendarEvent : ->
        return @_toFullCalendarEvent @getStartDateObject(), @getEndDateObject()

    _toFullCalendarEvent: (start, end) ->
        displayedTime = if not @isAllDay() then start.format 'H:mm[ ]' else ''
        description = @get 'description'
        description = description or t 'no description'
        return fcEvent =
            id: @cid
            title:  "#{displayedTime}#{description}"
            start: start
            end: end
            allDay: @isAllDay()
            startEditable: not @isRecurrent() #disable dragNdrop
            durationEditable: true
            diff: @get 'diff'
            place: @get 'place'
            timezone: @get 'timezone'
            type: @fcEventType
            backgroundColor: @getColor()
            borderColor: @getColor()

    # Override sync to ask email sending just before changes save on server.
    sync: (method, model, options) ->
        @confirmSendEmails method, (sendMails) ->
            # overrides the url to append the sendmails parameter
            options.url = "#{model.url()}?sendMails=#{sendMails}"
            return super method, model, options

    confirmSendEmails: (method, callback) ->
        if @get 'import' # No mails on files import.
            return callback false

        # Kind of changes which doesn't need mails.
        if method in ['update', 'patch'] and not (
                @startDateChanged or @attendeesChanged)
            return callback false

        # else: look state of each guest.
        attendees = @get('attendees') or []
        guestsToInform = attendees.filter (guest) ->
            if method is 'create'
                return true

            else if method is 'delete'
                 return guest.status in ['ACCEPTED', 'NEEDS-ACTION']

            else if method in ['update', 'patch']
                return guest.status is 'INVITATION-NOT-SENT' or (
                    guest.status is 'ACCEPTED' and @startDateChanged)

        .map (guest) -> guest.email

        if guestsToInform.length is 0
            callback false
        else
            guestsList = guestsToInform.join ', '
            content = "#{t 'send mails question'} #{guestsList}"
            Modal.confirm t('modal send mails'), content, \
                t('yes'), t('no'), callback

        @startDateChanged = false
        @attendeesChanged = false
