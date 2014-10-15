americano = require 'americano-cozy'
momentTz = require 'moment-timezone'

User = require './user'

module.exports = Event = americano.getModel 'Event',
    start       : type : String
    end         : type : String
    place       : type : String
    details     : type : String
    description : type : String
    rrule       : type : String
    tags        : type : (x) -> x # DAMN IT JUGGLING
    attendees   : type : [Object]
    related     : type : String, default: null
    timezone    : type : String
    alarms      : type : [Object]

# 'start' and 'end' use those format, 
# According to allDay or rrules.
Event.dateFormat = 'YYYY-MM-DD'
Event.ambiguousDTFormat = 'YYYY-MM-DDTHH:mm:00.000'
Event.utcDTFormat = 'YYYY-MM-DDTHH:mm:00.000Z'

# Handle only unique units strings.
Event.alarmTriggRegex = /(\+?|-)PT?(\d+)(W|D|H|M|S)/

require('cozy-ical').decorateEvent Event

# @TODO : migration script.
# insinuatingUTCToISO8601 = (dateStr) ->
#     # Skip buggy or empty values.
#     if not dateStr
#         return dateStr

#     # Check if it's already ISO8601
#     if (dateStr.charAt 10) == 'T'
#         return dateStr

#     d = dateStr
#     # Check for a timezone
#     if "GMT" not in dateStr
#         d = d + " GMT+0000"

#     return new Date(d).toISOString()


# Event.afterInitialize = () ->
#     @start = insinuatingUTCToISO8601(@start)
#     @end = insinuatingUTCToISO8601(@end)

#     @


Event.all = (params, callback) ->
    Event.request "all", params, callback

Event.tags = (callback) ->
    Event.rawRequest "tags", group: true, (err, results) ->
        return callback err if err
        out = calendar: [], tag: []
        for result in results
            [type, tag] = result.key
            out[type].push tag
        callback null, out

Event.createOrGetIfImport = (data, callback) ->
    if data.import
        Event.request 'byDate', key: data.start, (err, events) ->
            if err
                console.log err
                Event.create data, callback
            else if events.length is 0
                Event.create data, callback
            else if data.description is events[0].description
                log.warn 'Event already exists, it was not created.'
                callback(null, events[0])
            else
                Event.create data, callback
    else
        Event.create data, callback

Event::formatStart = (dateFormat) ->        
    if @rrule
        date = momentTz.tz(@start, @timezone).format dateFormat
        date += ' ' + @timezone
    
    else
        date = momentTz.tz(@start, User.timezone).format dateFormat

    return date

# @TODO : this doesn't handle merge correctly
Event::getGuest = (key) ->
    guests = @attendees?.toJSON() or []
    currentguest = guests.filter((guest) -> guest.key is key)[0]
    if currentguest
        currentguest.setStatus = (status, callback) =>
            currentguest.status = status
            @updateAttributes attendees: guests, callback

    return currentguest

# Return the emails to alert if action is EMAIL, or BOTH on the alarms.
# Actualy the attendee is the cozy's user.
Event::getAlarmAttendeesEmail = () ->
    return [User.email]


    # Further work to make the doctype iCal compliant
    # email properties
    #property 'summary', String, default: null
    #property 'attendee', String, default: null

    # display properties
    #property 'duration', String
    #property 'repeat', String

    ### Constraints an alarm of alarms
        * All types
            action{1} : in [AUDIO, DISPLAY, EMAIL, PROCEDURE]
            trigger{1} : when the alarm is triggered


        * Display
            description{1} : text to display when alarm is triggered
            (
                duration
                repeat
            )?

        * Email
            summary{1} : email title
            description{1} : email content
            attendee+ : email addresses the message should be sent to
            attach* : message attachments

        * Audio
            (
                duration
                repeat
            )?

            attach? : sound resource (base-64 encoded binary or URL)

        * Proc
            attach{1} : procedure resource to be invoked
            (
                duration
                repeat
            )?
            description?
    ###
