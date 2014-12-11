fs = require 'fs'
path = require 'path'
moment = require 'moment-timezone'
log = require('printit')
    prefix: 'events'

User = require '../models/user'
Event = require '../models/event'
{VCalendar} = require 'cozy-ical'
MailHandler = require '../mails/mail_handler'
localization = require '../libs/localization_manager'

module.exports.fetch = (req, res, next, id) ->
    Event.find id, (err, event) ->
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
    data.created = moment().tz('UTC').toISOString()
    data.lastModification = moment().tz('UTC').toISOString()
    Event.createOrGetIfImport data, (err, event) ->
        return res.error "Server error while creating event." if err
        if data.import or req.query.sendMails isnt 'true'
            res.send event, 201
        else
            MailHandler.sendInvitations event, false, (err, updatedEvent) ->
                res.send (updatedEvent or event), 201


module.exports.update = (req, res) ->
    start = req.event.start
    data = req.body
    data.lastModification = moment().tz('UTC').toISOString()
    req.event.updateAttributes data, (err, event) ->

        if err?
            res.send error: "Server error while saving event", 500
        else if req.query.sendMails is 'true'
            dateChanged = data.start isnt start
            MailHandler.sendInvitations event, dateChanged, (err, updatedEvent) ->
                res.send (updatedEvent or event), 200
        else
            res.send event, 200


module.exports.delete = (req, res) ->
    req.event.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the event", 500
        else if req.query.sendMails is 'true'
            MailHandler.sendDeleteNotification req.event, ->
                res.send success: true, 200
        else
            res.send success: true, 200


module.exports.public = (req, res) ->
    key = req.query.key
    if not visitor = req.event.getGuest key
        return res.send error: 'invalid key', 401

    if req.query.status in ['ACCEPTED', 'DECLINED']

        visitor.setStatus req.query.status, (err) ->
            return res.send error: "server error occured", 500 if err
            res.header 'Location': "./#{req.event.id}?key=#{key}"
            res.send 303

    else
        if req.event.isAllDayEvent()
            dateFormatKey = 'email date format allday'
        else
            dateFormatKey = 'email date format'
        dateFormat = localization.t dateFormatKey
        date = req.event.formatStart dateFormat

        locale = localization.getLocale()
        fileName = "event_public_#{locale}.jade"
        filePath = path.resolve __dirname, '../../client/', fileName
        fileName = 'event_public_en.jade' unless fs.existsSync(filePath)

        res.render fileName,
            event: req.event
            date: date
            key: key
            visitor: visitor


module.exports.ical = (req, res) ->
    key = req.query.key
    calendar = new VCalendar organization:'Cozy Cloud', title:'Cozy Calendar'
    calendar.add req.event.toIcal()
    res.header 'Content-Type': 'text/calendar'
    res.send calendar.toString()


module.exports.publicIcal = (req, res) ->
    key = req.query.key
    if not visitor = req.event.getGuest key
        return res.send error: 'invalid key', 401

    calendar = new ical.VCalendar organization: 'Cozy', 'Cozy Calendar'
    calendar.add req.event.toIcal()
    res.header 'Content-Type': 'text/calendar'
    res.send calendar.toString()


module.exports.bulkCalendarRename = (req, res) ->
    {oldName, newName} = req.body
    unless oldName?
        res.send 400, error: '`oldName` is mandatory'
    else if not newName?
        res.send 400, error: '`newName` is mandatory'
    else
        Event.bulkCalendarRename oldName, newName, (err, events) ->
            if err?
                res.send 500, error: err
            else
                res.send 200, events

module.exports.bulkDelete = (req, res) ->
    {calendarName} = req.body
    unless calendarName?
        res.send 400, error: '`calendarName` is mandatory'
    else
        Event.bulkDelete calendarName, (err, events) ->
            if err?
                res.send 500, error: err
            else
                res.send 200, events
