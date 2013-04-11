before ->
    Alarm.find req.params.id, (err, alarm) =>
        if err or not alarm
            send error: true, msg: "Alarm not found", 404
        else
            @alarm = alarm
            next()
# Make this pre-treatment only before update action.
, only: ['update']

action 'all', ->
    Alarm.all (err, alarms) ->
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            send alarms

action 'create', ->
    Alarm.create req.body, (err, alarm) =>
        if err
            send error: true, msg: "Server error while creating alarm.", 500
        else
            send alarm, 201

action 'update', ->
    @alarm.updateAttributes body, (err, alarm) ->
        if err?
            send error: true, msg: "Server error while saving alarm", 500
        else
            send alarm