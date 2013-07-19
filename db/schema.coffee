# User defines user that can interact with the Cozy instance.
User = define 'User', ->
    property 'email', String
    property 'timezone', String, default: "Europe/Paris"

Alarm = define 'Alarm', ->

    property 'action', String, default: 'DISPLAY'
    property 'trigg', String
    property 'description', String

    property 'related', String, default: null

Event = define 'Event', ->
    property 'start', String
    property 'end', String
    property 'place', String
    property 'description', String
    property 'diff', Number

    property 'related', String, default: null


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
