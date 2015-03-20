ical = require 'cozy-ical'
Event = require '../models/event'
Tag = require '../models/tag'
User  = require '../models/user'
multiparty = require 'multiparty'
fs = require 'fs'
child = require 'child_process'
rm = require 'rimraf'
zip = require 'bauer-zip'
# path = require 'path'
localization = require '../libs/localization_manager'

module.exports.export = (req, res) ->

    calendarId = req.params.calendarid
    createCalendar calendarId, (calendar) ->
        res.header 'Content-Type': 'text/calendar'
        res.send calendar.toString()


createCalendar = (calendarName, callback) ->
    calendar = new ical.VCalendar
        organization: 'Cozy'
        title: 'Cozy Calendar'
        name: calendarName
    Event.byCalendar calendarName, (err, events) ->
        if err
            res.send
                error: true
                msg: 'Server error occurred while retrieving data'
        else
            if events.length > 0
                calendar.add event.toIcal() for event in events
                callback calendar

module.exports.import = (req, res, next) ->

    form = new multiparty.Form()
    form.parse req, (err, fields, files) ->

        return next err if err

        cleanUp = ->
            for key, arrfile of files
                for file in arrfile
                    fs.unlink file.path, (err) ->
                        if err
                            console.log "failed to cleanup file", file.path, err

        unless file = files['file']?[0]
            res.send error: 'no file sent', 400
            return cleanUp()

        parser = new ical.ICalParser()
        options = defaultTimezone: User.timezone
        parser.parseFile file.path, options, (err, result) ->
            if err
                console.log err
                console.log err.message
                res.send 500, error: 'error occured while saving file'
                cleanUp()
            else
                Event.tags (err, tags) ->
                    calendars = tags.calendar
                    key = 'default calendar name'
                    defaultCalendar = calendars?[0] or localization.t key
                    calendarName = result?.model?.name or defaultCalendar
                    res.send 200,
                        events: Event.extractEvents result, calendarName
                        calendar:
                            name: calendarName
                    cleanUp()

module.exports.zipExport = (req, res) ->
    # create a tmp dir if not exists. Don't use trailing slash to avoid
    # unzip errors
    dir = '/tmp/cozy-cal'
    if !fs.existsSync dir
        fs.mkdir dir,'0744', (err) ->
             if err
                res.send
                error: true
                msg: 'Server error occurred while creating temp folders'

    # for each selected calendar, create ics file, and write it into tmp folder
    saveCal = (calName) ->
        createCalendar calName, (calendar) ->
            fs.writeFile dir + "/" + calName + ".ics", calendar, (err) ->
                throw err if err

    # parse name array received as parameter
    for calName in JSON.parse req.params.ids
        saveCal calName

    # build a zip file with every .ics file in the tmp foler and sent it as response
    zip.zip dir, "cozy.zip", (error) ->
        res.contentType 'application/zip'
        res.setHeader 'content-disposition','attachment; filename=' + "cozy.zip"
        stream = fs.createReadStream 'cozy.zip'
        stream.pipe res
        stream.on 'close', ->
            # cleaning the mess
            # tmp archive
            fs.unlink "cozy.zip", (err) ->
                if err
                    res.send
                    error: true
                    msg: 'Server error occurred while deleting temp archive'
            # tmp dir
            rm dir, (err) ->
                if err
                    res.send
                    error: true
                    msg: 'Server error occurred while deleting temp folders'
            return
