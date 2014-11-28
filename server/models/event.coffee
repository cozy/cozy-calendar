americano = require 'americano-cozy'
momentTz = require 'moment-timezone'
async = require 'async'
log = require('printit')
    prefix: 'event:model'

User = require './user'

module.exports = Event = americano.getModel 'Event',
    start       : type: String
    end         : type: String
    place       : type: String
    details     : type: String
    description : type: String
    rrule       : type: String
    tags        : type: (x) -> x # DAMN IT JUGGLING
    attendees   : type: [Object]
    related     : type: String, default: null
    timezone    : type: String
    alarms      : type: [Object]
    created     : type: String
    lastModification: type: String

# 'start' and 'end' use those format,
# According to allDay or rrules.
Event.dateFormat = 'YYYY-MM-DD'
Event.ambiguousDTFormat = 'YYYY-MM-DD[T]HH:mm:00.000'
Event.utcDTFormat = 'YYYY-MM-DD[T]HH:mm:00.000[Z]'

# Handle only unique units strings.
Event.alarmTriggRegex = /(\+?|-)PT?(\d+)(W|D|H|M|S)/

require('cozy-ical').decorateEvent Event


Event.all = (params, callback) ->
    Event.request "all", params, callback

Event.tags = (callback) ->
    Event.rawRequest "tags", group: true, (err, results) ->
        return callback err if err
        out = calendar: [], tag: []
        for result in results
            [type, tag] = result.key
            out[type].push tag
        callback null, out

Event.createOrGetIfImport = (data, callback) ->
    if data.import
        Event.request 'byDate', key: data.start, (err, events) ->
            if err
                log.error err
                Event.create data, callback
            else if events.length is 0
                Event.create data, callback
            else if data.description is events[0].description
                log.warn 'Event already exists, it was not created.'
                callback(null, events[0])
            else
                Event.create data, callback
    else
        Event.create data, callback

Event::formatStart = (dateFormat) ->
    if @rrule
        date = momentTz.tz @start, @timezone
    else
        date = momentTz @start

    date.tz User.timezone
    formattedDate = date.format dateFormat
    formattedDate += ' ' + User.timezone

    return dStr

# @TODO : this doesn't handle merge correctly
Event::getGuest = (key) ->
    guests = @attendees?.toJSON() or []
    currentguest = guests.filter((guest) -> guest.key is key)[0]
    if currentguest
        currentguest.setStatus = (status, callback) =>
            currentguest.status = status
            @updateAttributes attendees: guests, callback

    return currentguest

# Return the emails to alert if action is EMAIL, or BOTH on the alarms.
# Actualy the attendee is the cozy's user.
Event::getAlarmAttendeesEmail = ->
    return [User.email]

# November 2014 Migration :
# Migrate from v1.0.4 to next-gen doctypes.
# Use date format as key to detect doctype version.
Event::migrateDoctype = ->

    hasMigrate = @migrateDateTime 'start'
    # Quick quit if no migration.
    return @ if not hasMigrate

    @migrateDateTime 'end'

    if @rrule
        @timezone = User.timezone

    else
        @timezone = undefined

    @save (err) =>
        if err
            console.log err

        return @

Event::migrateDateTime = (dateField) ->
    dateStr = @[dateField]

    # Skip buggy or empty values.
    if not dateStr
        return false

    # Check if it's already ISO8601
    # Skip allDay event (leght is 10), because they didn't exist.
    if dateStr.length is 10 or dateStr.charAt(10) is 'T'
        return false

    d = dateStr
    # Check for a timezone
    if "GMT" not in dateStr
        d = d + " GMT+0000"

    m = momentTz.tz d, 'UTC'

    if @rrule
        timezone = User.timezone or "Europe/Paris"
        @[dateField] = m.tz(timezone).format Event.ambiguousDTFormat

    else
        @[dateField] = m.format Event.utcDTFormat

    return true

Event.migrateAll = ->
    Event.all {}, (err, events) ->
        if err
            console.log err
            return

        for event in events
            event.migrateDoctype()

Event.bulkCalendarRename = (oldName, newName, callback) ->
    Event.request 'byCalendar', key: oldName, (err, events) ->
        async.eachLimit events, 10, (event, done) ->
            # clones the array
            tags = [].concat event.tags
            tags[0] = newName
            event.updateAttributes {tags}, done
        , (err) -> callback err, events

Event.bulkDelete = (calendarName, callback) ->
    Event.request 'byCalendar', key: calendarName, (err, events) ->
        async.eachLimit events, 10, (event, done) ->
            event.destroy done
        , (err) -> callback err, events
