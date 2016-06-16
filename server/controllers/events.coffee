async = require 'async'
moment = require '../libs/moment'

User = require '../models/user'
Event = require '../models/event'
{VCalendar} = require 'cozy-ical'
MailHandler = require '../libs/mail_handler'
ShareHandler = require '../share/share_handler'
localization = require('cozy-localization-manager').getInstance()


module.exports.fetch = (req, res, next, id) ->
    Event.find id, (err, event) ->
        if err or not event
            res.status(400).send error: "Event not found"
        else
            req.event = event
            next()


module.exports.all = (req, res) ->
    Event.all (err, events) ->
        if err
            res.status(500).send
                error: 'Server error occurred while retrieving data'
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
        if err?
            res.status(500).send error: "Server error while creating event."
        else
            if data.import
                res.status(201).send event
            else
                # We first share the events, if the event is shared (this
                # condition is checked within `sendShareInvitations`)
                ShareHandler.sendShareInvitations event, (err, updatedEvent) ->

                    # If the event has guests that are notified by email and for
                    # whom the owner confirmed she wanted to send emails, we
                    # send the emails
                    if req.query.sendMails is 'true'
                        MailHandler.sendInvitations (updatedEvent or event),
                        false, (err, updatedEvent) ->
                            res.status(201).send (updatedEvent or event)
                    # Otherwise we just update the event
                    else
                        res.status(201).send (updatedEvent or event)


# Expect a list of events as body and create an event in database for each
# entry. When it's done, it returns the list of created events and events for
# which an error occured.
module.exports.createBulk = (req, res, next) ->
    events = req.body
    newEvents = []
    errors = []

    async.eachSeries events, (event, done) ->
        event.created = moment().tz('UTC').toISOString()
        event.lastModification = moment().tz('UTC').toISOString()
        event.id = null

        Event.createOrGetIfImport event, (err, newEvent) ->
            if err
                errors.push event
            else
                newEvents.push newEvent

            setTimeout done, 10

    , (err) ->
        return next err if err
        res.status(201).send
            events: newEvents
            errors: errors


module.exports.update = (req, res) ->
    start = req.event.start
    data = req.body
    data.lastModification = moment().tz('UTC').toISOString()
    req.event.updateAttributes data, (err, event) ->
        if err?
            res.status(500).send error: "Server error while saving event"
        else
            ShareHandler.sendShareInvitations event, (err, updatedEvent) ->
                if req.query.sendMails is 'true'
                    dateChanged = data.start isnt start

                    MailHandler.sendInvitations (updatedEvent or event),
                    dateChanged, (err, updatedEvent) ->
                        res.send (updatedEvent or event)
                else
                    res.send event


module.exports.delete = (req, res) ->
    req.event.destroy (err) ->
        if err?
            res.status(500).send error: "Server error while deleting the event"
        else if req.query.sendMails is 'true'
            MailHandler.sendDeleteNotification req.event, ->
                res.send success: true
        else
            res.send success: true


module.exports.public = (req, res, next) ->
    id = req.params.publiceventid
    key = req.query.key

    # Retrieve event
    Event.find id, (err, event) ->

        # If event doesn't exist or visitor hasn't access display 404 page
        if err or not event or not visitor = event.getGuest key
            # Retreive user localization
            locale = localization.polyglot?.locale()
            locale = 'en' unless locale is 'fr' # only files for FR and EN
            res.status 404
            res.render "404_#{locale}"

        # If event exists, guess is authorized and request has a status
        # Update status for guess (accepted or declined)
        else if req.query.status in ['ACCEPTED', 'DECLINED']
            visitor.setStatus req.query.status, (err) ->
                next err if err?
                res.header 'Location': "./#{event.id}?key=#{key}"
                res.status(303).send()

        # If event exists, guess is authorized and request hasn't a status
        # Display event.
        else
            locale = localization.polyglot?.locale() or 'en'

            # Retrieve event data
            if event.isAllDayEvent()
                dateFormatKey = 'email date format allday'
            else
                dateFormatKey = 'email date format'
            dateFormat = localization.t dateFormatKey
            date = event.formatStart dateFormat, locale

            locale = 'en' unless locale is 'fr' # only files for FR and EN

            specialCharacters = \
                /[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi
            desc = event.description.replace(specialCharacters, '')
            desc = desc.replace(/\ /g, '-')
            day =  moment(event.start).format("YYYY-MM-DD")

            res.render "event_public_#{locale}",
                event: event
                file: "#{day}-#{desc}"
                date: date
                key: key
                visitor: visitor


module.exports.ical = (req, res) ->

    User.getUserInfos (err, infos) ->

        calendar = new VCalendar
            organization:'Cozy Cloud'
            title: 'Cozy Calendar'

        vEvent = req.event.toIcal()

        # Force the event to take into account the organizer.
        if req.event.attendees?.length > 0
            vEvent.model.organizer =
                displayName: infos.name
                email: infos.email
            vEvent.build()

        calendar.add vEvent

        res.header 'Content-Type': 'text/calendar'
        res.send calendar.toString()


module.exports.publicIcal = (req, res) ->

    key = req.query.key

    if not req.event.getGuest key
        return res.status(401).send error: 'invalid key'

    module.exports.ical(req, res)


module.exports.bulkCalendarRename = (req, res) ->
    {oldName, newName} = req.body
    unless oldName?
        res.status(400).send
            error: '`oldName` is mandatory'
    else if not newName?
        res.status(400).send
            error: '`newName` is mandatory'
    else
        Event.bulkCalendarRename oldName, newName, (err, events) ->
            if err?
                res.status(500).send error: err
            else
                res.send events


module.exports.bulkDelete = (req, res) ->
    {calendarName} = req.body
    unless calendarName?
        res.status(400).send error: '`calendarName` is mandatory'
    else
        Event.bulkDelete calendarName, (err, events) ->
            if err?
                res.status(500).send error: err
            else
                res.send events


# Return events for the given month.
module.exports.monthEvents = (req, res, next) ->
    {month, year} = req.params
    start = moment "#{year}-#{month}-01", 'YYYY-MM-DD'
    end = start.clone().add 1, 'months'

    Event.load start, end, (err, events) ->
        return next err if err
        res.send events
