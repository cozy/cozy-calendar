americano = require 'americano-cozy'
time = require 'time'
User = require './user'

module.exports = Event = americano.getModel 'Event',
    start       : type : String
    end         : type : String
    place       : type : String
    description : type : String
    diff        : type : Number
    related: type: String, default: null

require('cozy-ical').decorateEvent Event

Event.all = (params, callback) ->
    Event.request "all", params, callback

# before sending to the client
# set the start/end in TZ time
Event::timezoned = (timezone) ->
    timezonedDate = new time.Date(@start, 'UTC')
    timezonedDate.setTimezone(timezone)
    @start = timezonedDate.toString().slice(0, 24)

    timezonedDate = new time.Date(@end, 'UTC')
    timezonedDate.setTimezone(timezone)
    @end = timezonedDate.toString().slice(0, 24)

    return @

# before saving
# take an attributes object
# if the object has a TZ, the start/end is considered to be in this TZ
# else we use the User's TZ
# set the start/end to UTC
Event.toUTC = (attrs) ->
    timezone = attrs.timezone or User.timezone

    start = new time.Date(attrs.start, timezone)
    start.setTimezone 'UTC'
    attrs.start = start.toString().slice(0, 24)

    end = new time.Date(attrs.end, timezone)
    end.setTimezone 'UTC'
    attrs.end = end.toString().slice(0, 24)

    return attrs


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
