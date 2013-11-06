time = require 'time'
User = require '../models/user'
Event = require '../models/event'

module.exports.fetch = (req, res, next, id) ->
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
            events[index] = evt.timezoned() for evt, index in events
            res.send events

module.exports.read = (req, res) ->
    res.send req.event.timezoned()


module.exports.create = (req, res) ->
    data = Event.toUTC(req.body)
    Event.create data, (err, event) =>
        return res.error "Server error while creating event." if err

        # Recover dates with user timezone
        res.send event.timezoned(), 201

module.exports.update = (req, res) ->
    data = Event.toUTC(req.body)
    req.event.updateAttributes data, (err, event) =>
        if err?
            res.send error: "Server error while saving event", 500
        else
            res.send event.timezoned(), 200

module.exports.delete = (req, res) ->
    req.event.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the event", 500
        else
            res.send success: true, 200