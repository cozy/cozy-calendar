before ->
    # Find bookmark
    Reminder.find req.params.id, (err, reminder) =>
        if err or not reminder
            send error: true, msg: "Reminder not found", 404
        else
            @reminder = reminder
            next()
# Make this pre-treatment only before destroy action.
, only: ['destroy']

action 'all', ->

    Reminder.all (err, reminders) ->
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            send reminders

action 'create', ->

    Reminder.create req.body, (err, reminder) =>
        if err
            send error: true, msg: "Server error while creating reminder.", 500
        else
            send reminder

action 'destroy', ->
    @reminder.destroy (err) ->
        if err
            compound.logger.write err
            send error: 'Cannot destroy reminder', 500
        else
            send success: 'reminder succesfuly deleted'