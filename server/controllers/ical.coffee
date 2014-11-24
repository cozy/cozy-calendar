ical = require 'cozy-ical'
Event = require '../models/event'
User = require  '../models/user'

module.exports.export = (req, res) ->
    calendar = new ical.VCalendar
        organization: 'Cozy'
        title: 'Cozy Calendar'
    Event.all (err, events) =>
        if err then res.send
                error: true
                msg: 'Server error occurred while retrieving data'
        else
            if events.length > 0
                calendar.add event.toIcal() for event in events

            res.header 'Content-Type': 'text/calendar'
            res.send calendar.toString()

module.exports.import = (req, res) ->
    file = req.files['file']
    if file?
        parser = new ical.ICalParser()
        parser.parseFile file.path, (err, result) ->
            if err
                console.log err
                console.log err.message
                res.send 500, error: 'error occured while saving file'
            else
                User.timezone ?= 'Europe/Paris'
                res.send 200, events: Event.extractEvents result
    else
        res.send error: 'no file sent', 500
