time = require 'time'
moment = require 'moment'
ical = require './lib/ical_helpers'


before ->

    @userTimezone = 'Europe/Paris'
    User.all (err, users) =>
        if err
            console.log err
        else if users.length is 0
            console.log 'No user registered.'
        else
            @userTimezone = users[0].timezone
            @userEmail = users[0].email

        next()


action 'export', ->
    calendar = Alarm.getICalCalendar()
    Alarm.all (err, alarms) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            calendar.add alarm.toIcal() for alarm in alarms
            res.header 'Content-Type': 'text/plain'
            send calendar.toString()


action 'import', ->
    file = req.files['file']
    if file?
        parser = new ical.ICalParser()
        parser.parseFile file.path, (err, result) ->
            if err
                console.log err
                send error: 'error occured while saving file', msg: err.msg, 500
            else
                @alarmsToImport = result
                send Alarm.extractAlarms result
    else
        send error: 'no file sent', 500

action 'confirm Import', ->
    if @alarmsToImport?

        for alarm in @alarmsToImport
            alarm.save()

    send success: 'import processed'
