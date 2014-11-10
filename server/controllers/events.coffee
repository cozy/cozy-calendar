momentTz = require 'moment-timezone'
log = require('printit')
    prefix: 'events'

User = require '../models/user'
Event = require '../models/event'
{VCalendar} = require 'cozy-ical'
MailHandler = require '../mails/mail_handler'
mails = new MailHandler()


module.exports.fetch = (req, res, next, id) ->
    Event.find id, (err, event) =>
        if err or not event
            acceptLanguage = req.headers['accept-language']
            if acceptLanguage?.indexOf('text/html') isnt -1
                res.send error: "Event not found", 404
            else
                res.send "Event not found: the event is probably canceled.",
                         404
        else
            req.event = event
            next()


module.exports.all = (req, res) ->
    Event.all (err, events) ->
        if err
            res.send error: 'Server error occurred while retrieving data'
        else
            res.send events


module.exports.read = (req, res) ->
    res.send req.event


# Create a new event. In case of import, it doesn't create the event if
# it already exists.
module.exports.create = (req, res) ->
    data = req.body
    Event.createOrGetIfImport data, (err, event) =>
        return res.error "Server error while creating event." if err
        res.send event, 201

module.exports.update = (req, res) ->
    start = req.event.start
    data = req.body

    req.event.updateAttributes data, (err, event) =>

        if err?
            res.send error: "Server error while saving event", 500
        else
            dateChanged = data.start isnt start

            mails.sendInvitations event, dateChanged, (err, event2) ->
                res.send (event2 or event), 200


module.exports.delete = (req, res) ->
    req.event.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the event", 500
        else
            mails.sendDeleteNotification req.event, ->
                res.send success: true, 200


module.exports.public = (req, res) ->
    key = req.query.key
    if not visitor = req.event.getGuest key
        return res.send error: 'invalid key', 401

    if req.query.status in ['ACCEPTED', 'DECLINED']

        visitor.setStatus req.query.status, (err) =>
            return res.send error: "server error occured", 500 if err
            res.header 'Location': "./#{req.event.id}?key=#{key}"
            res.send 303

    else
        dateFormat = 'MMMM Do YYYY, h:mm a'
        date = moment(req.event.start).format dateFormat
        res.render 'event_public.jade',
            event: req.event
            date: date
            key: key
            visitor: visitor


module.exports.ical = (req, res) ->
    key = req.query.key
    calendar = new VCalendar organization:'Cozy Cloud', title:'Cozy Agenda'
    calendar.add req.event.toIcal()
    res.header 'Content-Type': 'text/calendar'
    res.send calendar.toString()


module.exports.publicIcal = (req, res) ->
    key = req.query.key
    if not visitor = req.event.getGuest key
        return res.send error: 'invalid key', 401

    calendar = new VCalendar 'Cozy Cloud', 'Cozy Agenda'
    calendar.add req.event.toIcal()
    res.header 'Content-Type': 'text/calendar'
    res.send calendar.toString()
