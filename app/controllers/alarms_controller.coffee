before ->
    Alarm.find req.params.id, (err, alarm) =>
        if err or not alarm
            send error: true, msg: "Alarm not found", 404
        else
            @alarm = alarm
            next()
# Make this pre-treatment only before update and delete action.
, only: ['getOne', 'update', 'delete']

action 'all', ->
    Alarm.all (err, alarms) ->
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            send alarms

action 'getOne', ->
    send @alarm, 200

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
            send alarm, 200

action 'delete', ->
    @alarm.destroy (err) ->
        if err?
            send error: true, msg: "Server error while deleting the alarm", 500
        else
            send success: true, 200

