americano = require 'americano-cozy'

module.exports = Event = americano.getModel 'Event',
    start       : type : String
    end         : type : String
    place       : type : String
    description : type : String
    diff        : type : Number
    related: type: String, default: null

Event.all = (params, callback) ->
    Event.request "all", params, callback


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
