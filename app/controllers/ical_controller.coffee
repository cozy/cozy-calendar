time = require 'time'
moment = require 'moment'

before ->

    @convertAlarmDate = (alarm, timezone) ->
        timezonedDate = new time.Date(alarm.trigg)
        timezonedDate.setTimezone(timezone)
        alarm.trigg = timezonedDate.toString().slice(0, 24)
        alarm.trigg = moment(alarm.trigg).format('YYYYMMDDTHHMM00')
        return alarm

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

    buf = ""
    addLine = (line) ->
        buf += (line + '\n')

    addLine 'BEGIN:VCALENDAR'
    addLine 'VERSION:2.0'
    addLine 'PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN'

    Alarm.all (err, alarms) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            for alarm, index in alarms
                alarm = @convertAlarmDate alarm, @userTimezone
                addLine 'BEGIN:VTODO'
                addLine 'DTSTAMP:' + alarm.trigg
                addLine 'UID:' + @userEmail
                addLine 'ACTION:AUDIO'
                addLine 'TRIGGER:' + alarm.trigg
                addLine 'REPEAT:1'
                addLine 'END:VTODO'

            addLine 'END:VCALENDAR'
            send buf
