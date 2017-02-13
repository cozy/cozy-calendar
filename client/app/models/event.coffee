ScheduleItem = require './scheduleitem'
Sharing = require './sharing'
request = require '../lib/request'


module.exports = class Event extends ScheduleItem

    fcEventType: 'event'
    startDateField: 'start'
    endDateField: 'end'
    urlRoot: 'events'

    defaults: ->
        defaultCalendar =
            app.settings.get('defaultCalendar') or \
            app.calendars?.at(0)?.get('name') or \
            t('default calendar name')
        details: ''
        description: ''
        place: ''
        tags: [defaultCalendar]

    getDiff: ->
        return @getEndDateObject().diff @getStartDateObject(), 'days'

    # Update start, with values in setObj,
    # while ensuring that end stays after start.
    # @param setObj a object, with hour, minute, ... as key, and corrresponding
    # values, in the cozy's user timezone.
    setStart: (setObj) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        @_setDate(setObj, sdo, @startDateField)

        # Check and put end after start.
        if sdo >= edo
            edo = sdo.clone().add 1, 'hour'

            @set @endDateField, @_formatMoment edo

    # Same as update start, for end field.
    setEnd: (setObj) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        @_setDate(setObj, edo, @endDateField)

        # Check start is before end, and move start.
        if sdo >= edo
            sdo = edo.clone().add -1, 'hour'

            @set @startDateField, @_formatMoment sdo

    _setDate: (setObj, dateObj, dateField) ->
        for unit, value of setObj
            dateObj.set unit, value

        @set dateField, @_formatMoment dateObj

    setDiff: (days) ->
        edo = @getStartDateObject().startOf 'day'
        edo.add days, 'day'

        if not @isAllDay()
            oldEnd = @getEndDateObject()
            edo.set 'hour', oldEnd.hour()
            edo.set 'minute', oldEnd.minute()

            # Check and put end after start.
            sdo = @getStartDateObject()
            if sdo >= edo
                edo = sdo.clone().add 1, 'hour'

        @set @endDateField, @_formatMoment edo

    validate: (attrs, options) ->

        errors = []

        unless attrs.description?
            errors.push
                field: 'description'
                value: "no summary"

        if not attrs.start or not (start = moment(attrs.start)).isValid()
            errors.push
                field: 'startdate'
                value: "invalid start date"

        if not attrs.end or not (end = moment(attrs.end)).isValid()
            errors.push
                field: 'enddate'
                value: "invalid end date"

        if start.isAfter end
            errors.push
                field: 'date'
                value: "start after end"

        return errors if errors.length > 0

    #@TODO tags = color
    getDefaultColor: -> '#008AF6'


    # A shared event has at least one attendees with a cozy invitation
    isShared: ->
        attendees = @get 'attendees'
        cozyAttendees = attendees?.find (attendee) ->
            return attendee.isSharedWithCozy
        return cozyAttendees?


    # Try to get a shareID (called typically just after saving).
    tryGetShareID: (numtries, delay, callback) ->

        @fetch
            success: (model, response) =>
                shareID = model.get 'shareID'
                if shareID
                    callback null, shareID
                    return

                triesLeft = --numtries

                if numtries
                    setTimeout =>
                        @tryGetShareID triesLeft, delay, callback
                    , delay
                else
                    callback 'Could not retrieve shareID, maximum \
                        number of tries exceeded',
                        null
            error: (model, response) ->
                callback(response.error or response, null)


    # Fetch the sharing object to handle any error
    onShareIDChange: ->
        @fetchSharing (err, sharing) =>
            if err
                throw
                    name: 'EventSharingError',
                    event: @
                    message: err
            else
                sharing.getFailedTargets().forEach (target) =>
                    throw
                        name: 'EventSharingError',
                        event: @
                        target: target


    # Override the native save mehod to bypass the success callback with
    # a custom one dealing with event sharing case.
    # The idea is to only call the success callback when the shareID
    # has been actually fetched.
    save: (attributes, options) ->
        successCallback = options?.success
        options.success = (model, response, options) =>
            # Call the original success handler, before dealing with
            # sharing aspect
            successCallback model, response, options

            # And then deal with the sharing
            # The goal is to detect any error occurring asynchronously
            if @isShared() and not @hasSharing()
                @tryGetShareID 5, 2000, (err, shareID) =>
                    if err
                        throw
                            name: 'EventSharingError'
                            event: @
                            message: err
                    else
                        @onShareIDChange()

        super attributes, options


    hasSharing: ->
        return @get('shareID')?


    onSharingChange: (sharing)->
        @updateAttendeesFromSharing sharing


    # Check for event editability, for that we need to check if it's a
    # shared event and if so, fetch the related sharing.
    fetchEditability: (callback) ->
        if not @isNew() and @hasSharing()
            @fetchSharing (err, sharing) =>
                if err
                    callback err, false
                else
                    isEditable = @get('shareID') is sharing.get('id')
                    callback null, isEditable
        else
            callback null, true


    fetchSharing: (callback) ->
        if not @hasSharing()
            callback null, null
            return

        if @sharing
            callback null, @sharing
            return

        successHandler = (sharing, response, options) =>
            @sharing = sharing
            @listenTo @sharing, 'change', @onSharingChange
            callback null, sharing

        errorHandler = (err) ->
            callback err, null

        # If the exist test fails, it means that the document is shared by
        # another cozy owner. So we try to get a sharing with the shareID.
        # Reminder :
        #   The user is the sharer : a sharing object having the event's
        #       shareID as id exists.
        #   The user is the recipient : a sharing object having the same
        #       shareID property than the event exists.
        request.exist @get('shareID'), (err, exist) =>
            if err?
                errorHandler err
            # A document having an id equal to the shareID exists: sharer.
            else if exist
                sharingToFetch = new Sharing id: @get('shareID')
                sharingToFetch.fetch
                    success: successHandler
                    error  : errorHandler
            # No document having an id equal to the shareID exists: recipient.
            else
                @fetchSharingByShareId (err, sharing) ->
                    if err?
                        errorHandler err
                    else
                        successHandler sharing


    fetchSharingByShareId: (callback) ->
        if not @hasSharing()
            callback null, null
            return

        if @sharing
            callback null, @sharing
            return

        sharingToFetch = new Sharing()
        sharingToFetch.fetch
            data: shareID: @get 'shareID'
            success: (sharing, response, options) ->
                callback null, sharing

            error: (sharing, resopnse, options) ->
                callback JSON.parse(response.responseText), null


    fetchAttendeesStatuses: (callback) ->
        @fetchSharing (err, sharing) =>
            if err
                callback err, null
            else if sharing
                callback null, @updateAttendeesFromSharing sharing
            else
                callback null, @get 'attendees'

    updateAttendeesFromSharing: (sharing) ->
        sharingChanged = not _.isEqual @cachedAttendeesSharing, sharing
        if not sharingChanged
            return @get 'attendees'

        @set 'attendees', @get('attendees').map (attendee) ->
            return attendee if not attendee.isSharedWithCozy

            target = sharing.get('targets').find (target) ->
                return target.recipientUrl is attendee.cozy

            # If an attendee is invited to an event with a Cozy sharing,
            # he should be in the list of the sharing's targets.
            # If not, it means that he refused.
            # If it is and the target has a 'token' property, it means that
            # he accepted the sharing.
            # Otherwise, it means that he did not reply

            # The recipient directly have an accepted property on his sharing
            # object

            # We use a reduce pattern here instead of if/else to facilitate
            # future status addition
            statusRules =
                'DECLINED': (sharing, target) ->
                    not target? and not sharing.get 'accepted'
                'ACCEPTED': (sharing, target) ->
                    target?.token? or sharing.get 'accepted'
                'NEED-ACTION': (sharing, target) ->
                    target? and not target.token


            statusReducer = (previous, status) ->
                previous or
                    if statusRules[status] sharing, target then status else null

            attendee.status =
                Object.keys(statusRules).reduce statusReducer, null

            return attendee

        @trigger 'change:attendees', @

        @cachedAttendeesSharing = _.clone sharing

        return @get 'attendees'


    # Prepare data before sync.
    prepare: ->
        # Remove trailing slash from any cozy url in attendees
        attendees = @get('attendees') or []
        @set 'attendees', attendees.map (attendee) ->
            return _.extend _.clone(attendee),
                # Remove trailing slash to allow easier comparison with sharing
                # objects
                cozy: attendee.cozy?.replace /\/$/, ''


    sync: (method, model, options) ->
        @prepare()
        super method, model, options

