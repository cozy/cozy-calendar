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

    # Recover alarm timezone if it exists
    if req.body? and req.body.timezone? req.body.timezone isnt 'timezone'
        @alarmTimezone = req.body.timezone
    else if @alarm?
        @alarmTimezone = @alarm.timezone

    # Recover user timezone
    User.all (err, users) =>
        if err
            console.log err
        else if users.length is 0
            console.log 'No user registered.'
        else
            @userTimezone = users[0].timezone
        # Initialize timezone: userTimezone if alarm has not specific timezone
        @timezone = @userTimezone
        if @alarmTimezone? and @alarmTimezone isnt null
            @timezone = @alarmTimezone
        if @alarm?
            @alarm.timezone = @timezone

        next()

, except: ['delete']


action 'all', ->
    Alarm.all (err, alarms) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            for alarm, index in alarms
                if alarm.timezone? and alarm.timezone isnt null
                    alarms[index] = @convertAlarmDate(alarm, alarm.timezone)
                else
                    alarm.timezone = @userTimezone
                    alarms[index] = @convertAlarmDate(alarm, @timezone)
            send alarms

action 'getOne', ->
    @alarm.timezone = @timezone
    @alarm = @convertAlarmDate(@alarm, @timezone)
    send @alarm, 200

action 'create', ->
    triggerDate = new time.Date(req.body.trigg, @timezone)
    triggerDate.setTimezone('UTC')
    req.body.trigg = triggerDate.toString().slice(0, 24)

    req.body.timezone = @timezone
    Alarm.create req.body, (err, alarm) =>
        if err
            send error: true, msg: "Server error while creating alarm.", 500
        else
            alarm = @convertAlarmDate(alarm, @timezone)
            send alarm, 201

action 'update', ->
    triggerDate = new time.Date(req.body.trigg, @timezone)
    triggerDate.setTimezone('UTC')
    req.body.trigg = triggerDate.toString().slice(0, 24)

    @alarm.timezone = @timezone
    @alarm.updateAttributes body, (err, alarm) =>
        if err?
            send error: true, msg: "Server error while saving alarm", 500
        else
            alarm = @convertAlarmDate(alarm, @timezone)
            send alarm, 200

action 'delete', ->
    @alarm.destroy (err) ->
        if err?
            send error: true, msg: "Server error while deleting the alarm", 500
        else
            send success: true, 200

