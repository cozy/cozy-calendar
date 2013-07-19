time = require 'time'

before ->
    Alarm.find req.params.id, (err, alarm) =>
        if err or not alarm
            send error: true, msg: "Alarm not found", 404
        else
            @alarm = alarm
            next()
# Make this pre-treatment only before update and delete action.
, except: ['create', 'all']

before ->

    @convertAlarmDate = (alarm, timezone) ->
        timezonedDate = new time.Date(alarm.trigg, 'UTC')
        timezonedDate.setTimezone(timezone)
        alarm.trigg = timezonedDate.toString().slice(0, 24)
        return alarm

    @userTimezone = 'Europe/Paris'
    User.all (err, users) =>
        if err
            console.log err
        else if users.length is 0
            console.log 'No user registered.'
        else
            @userTimezone = users[0].timezone

        next()


, except: ['delete']

action 'all', ->

    Alarm.all (err, alarms) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            for alarm, index in alarms
                alarms[index] = @convertAlarmDate(alarm, @userTimezone)
            send alarms

action 'getOne', ->
    @alarm = @convertAlarmDate(@alarm, @userTimezone)
    send @alarm, 200

action 'create', ->

    triggerDate = new time.Date(req.body.trigg, @userTimezone)
    triggerDate.setTimezone('UTC')
    req.body.trigg = triggerDate.toString().slice(0, 24)

    Alarm.create req.body, (err, alarm) =>
        if err
            send error: true, msg: "Server error while creating alarm.", 500
        else
            alarm = @convertAlarmDate(alarm, @userTimezone)
            send alarm, 201

action 'update', ->

    triggerDate = new time.Date(req.body.trigg, @userTimezone)
    triggerDate.setTimezone('UTC')
    req.body.trigg = triggerDate.toString().slice(0, 24)

    @alarm.updateAttributes body, (err, alarm) =>
        if err?
            send error: true, msg: "Server error while saving alarm", 500
        else
            alarm = @convertAlarmDate(alarm, @userTimezone)
            send alarm, 200

action 'delete', ->
    @alarm.destroy (err) ->
        if err?
            send error: true, msg: "Server error while deleting the alarm", 500
        else
            send success: true, 200

