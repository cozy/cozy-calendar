time = require 'time'


convertEventDate = (evt, timezone) ->
    # Convert dates from UTC to user timezone
    timezonedDate = new time.Date(evt.start, 'UTC')
    timezonedDate.setTimezone(timezone)
    evt.start = timezonedDate.toString().slice(0, 24)
    timezonedDate = new time.Date(evt.end, 'UTC')
    timezonedDate.setTimezone(timezone)
    evt.end = timezonedDate.toString().slice(0, 24)
    return evt

## Actions

module.exports.fetch = (req, res, id, next) ->
    Event.find id, (err, event) =>
        if err or not event
            res.send error: "Event not found", 404
        else
            req.event = event
            next()


module.exports.all = (req, res) ->
    Event.all (err, events) ->
        if err
            res.send error: 'Server error occurred while retrieving data'
        else
            for evt, index in events
                events[index] = convertEventDate evt, User.timezone
            res.send events

module.exports.read = (req, res) ->
    res.send convertEventDate req.event, User.timezone


module.exports.create = (req, res) ->
    # Store dates in UTC
    startDate = new time.Date(req.body.start, User.timezone)
    startDate.setTimezone('UTC')
    req.body.start = startDate.toString().slice(0, 24)

    endDate = new time.Date(req.body.end, User.timezone)
    endDate.setTimezone('UTC')
    req.body.end = endDate.toString().slice(0, 24)

    Event.create req.body, (err, evt) =>
        return res.error "Server error while creating event." if err

        # Recover dates with user timezone
        res.send convertEventDate(event, User.timezone), 201

module.exports.update = (req, res) ->
    # Store dates in UTC
    startDate = new time.Date(req.body.start, User.timezone)
    startDate.setTimezone('UTC')
    req.body.start = startDate.toString().slice(0, 24)

    endDate = new time.Date(req.body.end, User.timezone)
    endDate.setTimezone('UTC')
    req.body.end = endDate.toString().slice(0, 24)

    req.event.updateAttributes body, (err, evt) =>
        if err?
            res.send error: "Server error while saving event", 500
        else
            res.send convertEventDate(evt, User.timezone), 200

module.exports.delete = (req, res) ->
    req.event.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the event", 500
        else
            res.send success: true, 200