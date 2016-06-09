cozydb = require 'cozydb'
async = require 'async'
moment = require '../libs/moment'
Event = require './event'
log = require('printit')
    prefix: 'alarm:model'

User = require './user'

# Alarm should be interpreted as VTODO + VALARM iCal objects.
# with DTSTART <-> trigg ; DURATION = 0 ; TRIGGER = 0 .
module.exports = Alarm = cozydb.getModel 'Alarm',
    action : type : String, default: 'DISPLAY' # One of DISPLAY, EMAIL, BOTH.
    trigg : type : String # DT to trigger at.
        # As UTC if ponctual. If recurent, to interpret in @timezone.
    description : type : String
    timezone : type : String # Timezone of trigg time (if recurent)
    rrule : type : String # recurring rule.
    tags : type : [String]
    related : type : String, default: null
    created     : type: String
    lastModification: type: String

Alarm.tags = (callback) ->
    Alarm.rawRequest "tags", group: true, (err, results) ->
        return callback err if err
        out = calendar: [], tag: []
        for result in results
            [type, tag] = result.key
            out[type].push tag
        callback null, out

Alarm.createOrGetIfImport = (data, callback) ->
    if data.import
        Alarm.request 'byDate', key: data.trigg, (err, alarms) ->
            if err
                log.error err
                Alarm.create data, callback
            else if alarms.length is 0
                Alarm.create data, callback
            else if data.description is alarms[0].description
                log.warn 'Alarm already exists, it was not created.'
                callback(null, alarms[0])
            else
                Alarm.create data, callback
    else
        Alarm.create data, callback

# Return the emails to alert if action is EMAIL, or BOTH.

# Actualy the attendee is the cozy's user.
Alarm::getAttendeesEmail = ->
    return [User.email]

# November 2014 Migration :
# Migrate from v1.0.4 to next-gen doctypes.
# Use date format as key to detect doctype version.
Alarm::migrateDoctype = (callback) ->
    timezone = @timezone or 'UTC'
    date = moment.tz(@trigg, timezone).format 'YYYY-MM-DD'

    body =
        start: date
        end: date
        description: @description
        place: ''
        rrule: ''
        tags: @tags
        alarms: [
            {id: 1, trigg: '-PT10M', action: 'DISPLAY'}
        ]
        attendees: []
        created: moment().tz('UTC').toISOString()
        lastModification: moment().tz('UTC').toISOString()

    Event.create body, => @destroy callback

Alarm.migrateAll = (callback) ->
    Alarm.all {}, (err, alarms) ->
        if err
            console.log err
            callback()
        else
            async.eachLimit alarms, 10, (alarm, done) ->
                alarm.migrateDoctype done
            , callback
