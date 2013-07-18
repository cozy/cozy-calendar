time = require 'time'

before ->
    Event.find req.params.id, (err, evt) =>
        if err or not evt
            send error: true, msg: "Event not found", 404
        else
            @event = evt
            next()
# Make this pre-treatment only before update and delete action.
, except: ['create', 'all']

before ->

    @convertEventDate = (evt, timezone) ->
        timezonedDate = new time.Date(evt.trigg)
        timezonedDate.setTimezone(timezone)
        evt.trigg = timezonedDate.toString().slice(0, 24)
        return evt

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
    Event.all (err, events) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            for evt, index in events
                events[index] = @convertEventDate(evt, @userTimezone)
            send events

action 'getOne', ->
    @event = @convertEventDate(@event, @userTimezone)
    send @event, 200

action 'create', ->

    startDate = new time.Date(req.body.start, @userTimezone)
    startDate.setTimezone('UTC')
    req.body.start = startDate.toString().slice(0, 24)

    endDate = new time.Date(req.body.end, @userTimezone)
    endDate.setTimezone('UTC')
    req.body.end = endDate.toString().slice(0, 24)

    Event.create req.body, (err, evt) =>
        console.log evt
        if err
            send error: true, msg: "Server error while creating event.", 500
        else
            evt = @convertEventDate(evt, @userTimezone)
            send evt, 201

action 'update', ->

    startDate = new time.Date(req.body.start, @userTimezone)
    startDate.setTimezone('UTC')
    req.body.start = startDate.toString().slice(0, 24)

    endDate = new time.Date(req.body.end, @userTimezone)
    endDate.setTimezone('UTC')
    req.body.end = endDate.toString().slice(0, 24)

    @event.updateAttributes body, (err, evt) =>
        if err?
            send error: true, msg: "Server error while saving event", 500
        else
            evt = @convertEventDate(evt, @userTimezone)
            send evt, 200

action 'delete', ->
    @event.destroy (err) ->
        if err?
            send error: true, msg: "Server error while deleting the event", 500
        else
            send success: true, 200 