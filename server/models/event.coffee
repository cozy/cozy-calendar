americano = require 'americano-cozy'
momentTz = require 'moment-timezone'

User = require './user'

module.exports = Event = americano.getModel 'Event',
    start       : type : String
    end         : type : String
    place       : type : String
    # @TODO : rename those to follow ical (NEED PATCH)
    details     : type : String # = ical DESCRIPTION
    description : type : String # = ical SUMMARY
    diff        : type : Number # Deprecated !?
    rrule       : type : String
    tags        : type : (x) -> x # DAMN IT JUGGLING
    attendees   : type : [Object]
    related: type: String, default: null
    timezone: type: String
    alarms: type : [Object] # triggers.

# 'start' and 'end' use those format, 
# According to allDay or rrules.
Event.dateFormat = 'YYYY-MM-DD'
Event.ambiguousDTFormat = 'YYYY-MM-DDTHH:mm:00.000'
Event.utcDTFormat = 'YYYY-MM-DDTHH:mm:00.000Z'

# Handle only unique units strings.
Event.alarmTriggRegex = /(\+?|-)PT?(\d+)(W|D|H|M|S)/

require('cozy-ical').decorateEvent Event

# TODO : migration script.
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

# TODO 20140923 from #119 : usage ?
# Event::getCouchStartDate = ->
#     @timezone ?= User.timezone

#     momentTz(@start)
#         .tz(@timezone)
#         .tz('UTC')
#         .format('YYYY-MM-DDTHH:mm:ss.000') + 'Z'


# @TODO : this doesn't handle merge correctly
Event::getGuest = (key) ->
    guests = @attendees?.toJSON() or []
    currentguest = guests.filter((guest) -> guest.key is key)[0]
    if currentguest
        currentguest.setStatus = (status, callback) =>
            currentguest.status = status
            @updateAttributes attendees: guests, callback

    return currentguest



# # before sending to the client
# # set the start/end in TZ time
# Event::timezoned = (timezone) ->
#     timezone ?= User.timezone

#     timezonedDate = new time.Date(@start, 'UTC')
#     timezonedDate.setTimezone(timezone)
#     @start = timezonedDate.toString().slice(0, 24)

#     timezonedDate = new time.Date(@end, 'UTC')
#     timezonedDate.setTimezone(timezone)
#     @end = timezonedDate.toString().slice(0, 24)

#     return @

# # before saving
# # take an attributes object
# # if the object has a TZ, the start/end is considered to be in this TZ
# # else we use the User's TZ
# # set the start/end to UTC
# Event.toUTC = (attrs) ->
#     timezone = attrs.timezone or User.timezone

#     start = new time.Date(attrs.start, timezone)
#     start.setTimezone 'UTC'
#     attrs.start = start.toString().slice(0, 24)

#     end = new time.Date(attrs.end, timezone)
#     end.setTimezone 'UTC'
#     attrs.end = end.toString().slice(0, 24)

#     return attrs


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
