time = require 'time'

## Before and after method

# Recover event with id equal to req.params.id
before ->
    Event.find req.params.id, (err, evt) =>
        if err or not evt
            send error: true, msg: "Event not found", 404
        else
            @event = evt
            next()
# Make this pre-treatment only before update and delete action.
, except: ['create', 'all']

# Initialize convertEvenDate and userTimezone 
before ->
    @convertEventDate = (evt, timezone) ->
        # Convert dates from UTC to user timezone
        timezonedDate = new time.Date(evt.start, 'UTC')
        timezonedDate.setTimezone(timezone)
        evt.start = timezonedDate.toString().slice(0, 24)
        timezonedDate = new time.Date(evt.end, 'UTC')
        timezonedDate.setTimezone(timezone)
        evt.end = timezonedDate.toString().slice(0, 24)
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

## Actions

action 'all', ->
    Event.all (err, events) =>
        if err
            send error: true, msg: 'Server error occurred while retrieving data'
        else
            for evt, index in events
                events[index] = @convertEventDate(evt, @userTimezone)
            send events

action 'getOne', ->
    # Recover dates with user timezone
    @event = @convertEventDate(@event, @userTimezone)
    send @event, 200

action 'create', ->
    # Store dates in UTC
    startDate = new time.Date(req.body.start, @userTimezone)
    startDate.setTimezone('UTC')
    req.body.start = startDate.toString().slice(0, 24)

    endDate = new time.Date(req.body.end, @userTimezone)
    endDate.setTimezone('UTC')
    req.body.end = endDate.toString().slice(0, 24)

    Event.create req.body, (err, evt) =>
        if err
            send error: true, msg: "Server error while creating event.", 500
        else
            # Recover dates with user timezone
            evt = @convertEventDate(evt, @userTimezone)
            send evt, 201

action 'update', ->
    # Store dates in UTC
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
            # Recover dates with user timezone
            evt = @convertEventDate(evt, @userTimezone)
            send evt, 200

action 'delete', ->
    @event.destroy (err) ->
        if err?
            send error: true, msg: "Server error while deleting the event", 500
        else
            send success: true, 200 