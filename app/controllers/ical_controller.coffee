time = require 'time'
moment = require 'moment'

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


action 'ics', ->

    calendar = Alarm.getICalCalendar()
    Alarm.all (err, alarms) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            for alarm in alarms
                calendar.add alarm.toIcal()
            res.header 'Content-Type': 'text/plain'
            send calendar.toString()
