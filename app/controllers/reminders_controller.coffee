###

The application doesn't provide Todos functionalities in the 'iCal' meaning of
the term. Therefore we use the VTODO format to wrap alarms in order to be
compliant with the standard.

###

sleep = require 'sleep'

before ->
    VTodo.find req.params.id, (err, vtodo) =>
        if err or not vtodo
            send error: true, msg: "VTodo not found", 404
        else
            @vtodo = vtodo
            next()
# Make this pre-treatment only before update action.
, only: ['update']

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

action 'update', ->

    @vtodo.updateAttributes body, (err, vtodo) ->
        if err?
            send error: true, msg: "Server error while saving vtodo", 500
        else
            send vtodo