###

The application doesn't provide Todos functionalities in the 'iCal' meaning of
the term. Therefore we use the VTODO format to wrap alarms in order to be
compliant with the standard.

###

before ->
    VTodo.find req.params.id, (err, vtodo) =>
        if err or not vtodo
            send error: true, msg: "VTodo not found", 404
        else
            @reminder = vtodo
            next()
# Make this pre-treatment only before destroy action.
, only: ['destroy']

action 'all', ->

    VTodo.all (err, vtodos) ->
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            send vtodos

action 'create', ->

    VTodo.create req.body, (err, vtodo) =>
        if err
            send error: true, msg: "Server error while creating vtodo.", 500
        else
            send vtodo

action 'destroy', ->
    @vtodo.destroy (err) ->
        if err
            compound.logger.write err
            send error: 'Cannot destroy vtodo', 500
        else
            send success: 'VTodo succesfuly deleted'