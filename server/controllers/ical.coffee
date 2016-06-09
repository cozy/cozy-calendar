ical = require 'cozy-ical'
Event = require '../models/event'
Tag = require '../models/tag'
User  = require '../models/user'
multiparty = require 'multiparty'
fs = require 'fs'
archiver = require 'archiver'
async = require 'async'
defaultCalendar = require('../libs/default_calendar')
log = require('printit')
    date: true
    prefix: 'calendar:ical'

module.exports.export = (req, res) ->
    calendarId = req.params.calendarid
    createCalendar calendarId, (err, calendar) ->
        res.header 'Content-Type': 'text/calendar'
        res.send calendar.toString()

createCalendar = (calendarName, callback) ->
    calendar = new ical.VCalendar
        organization: 'Cozy'
        title: 'Cozy Calendar'
        name: calendarName

    Event.byCalendar calendarName, (err, events) ->
        return callback err if err

        if events.length > 0
            calendar.add event.toIcal() for event in events
            callback null, calendar

module.exports.import = (req, res, next) ->

    form = new multiparty.Form()
    form.parse req, (err, fields, files) ->

        return next err if err

        logError = (err) ->
            log.error "failed to cleanup file", file.path, err if err

        cleanUp = ->
            for key, arrfile of files
                for file in arrfile
                    fs.unlink file.path, logError
                    undefined


        unless file = files['file']?[0]
            res.status(400).send error: 'no file sent'
            return cleanUp()

        parser = new ical.ICalParser()
        options = defaultTimezone: User.timezone
        parser.parseFile file.path, options, (err, result) ->
            if err
                log.error err
                log.error err.message
                res.status(500).send error: 'error occured while saving file'
                cleanUp()
            else
                Event.tags (err, tags) ->
                    calendars = tags.calendar
                    defaultCalendar = calendars?[0] or defaultCalendar.getName()
                    calendarName = result?.model?.name or defaultCalendar
                    try
                        events = Event.extractEvents result, calendarName
                        res.status(200).send
                            events: events
                            calendar:
                                name: calendarName
                    catch e
                        log.error e.stack
                        log.error result
                        res.status(500).send
                            error: 'error occured while parsing file'
                    cleanUp()

module.exports.zipExport = (req, res, next) ->
    archive = archiver 'zip'
    zipName = 'cozy-calendars'

    # Build zip from file list and pip the result in the response.
    makeZip = (zipName, files) ->

        # Start the streaming.
        archive.pipe res

        # Arbort archiving process when request is closed.
        req.on 'close', ->
            archive.abort()

        # Set headers describing the final zip file.
        disposition = "attachment; filename=\"#{zipName}.zip\""
        res.setHeader 'Content-Disposition', disposition
        res.setHeader 'Content-Type', 'application/zip'

        async.eachSeries files, addToArchive, (err) ->
            return next err if err
            archive.finalize (err, bytes) ->
                return next err if err

    addToArchive = (cal, cb) ->
        archive.append cal.toString(), name: cal.model.name + ".ics"
        cb()

    # Build cals and pass it to makeZip
    async.map JSON.parse(req.params.ids), createCalendar, (err, cals) ->
        return next err if err
        makeZip zipName, cals
