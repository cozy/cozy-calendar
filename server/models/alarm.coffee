americano = require 'americano-cozy'
log = require('printit')
    prefix: 'alarm:model'

User = require './user'

# Alarm should be interpreted as VTODO + VALARM iCal objects.
# with DTSTART <-> trigg ; DURATION = 0 ; TRIGGER = 0 .
module.exports = Alarm = americano.getModel 'Alarm',
    action : type : String, default: 'DISPLAY' # One of DISPLAY, EMAIL, BOTH.
    trigg : type : String # DT to trigger at.
        # As UTC if ponctual. If recurent, to interpret in @timezone.
    description : type : String
    timezone : type : String # Timezone of trigg time (if recurent)
    rrule : type : String # recurring rule.
    tags : type : (x) -> x # DAMN IT JUGGLING
    related : type : String, default: null


require('cozy-ical').decorateAlarm Alarm

# @TODO: migration script.
# Add a doctype version somewhere ?
Alarm::migrateDoctype = () ->
    # Skip buggy or empty values.
    if not @trigg
        return @

    # Check if it's already ISO8601
    if (@trigg.charAt 10) is 'T'
        return @

    d = @trigg
    # Check for a timezone
    if "GMT" not in d
        d = d + " GMT+0000"
    @trigg = new Date(d).toISOString()
    return @

Alarm.all = (params, callback) ->
    Alarm.request "all", params, callback

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
# Actually the attendee is the cozy's user.
Alarm::getAttendeesEmail = ->
    return [User.email]
