americano = require 'americano-cozy'
time = require 'time'
User = require './user'

# Alarm should be interpreted as VTODO + VALARM iCal objects.
# with DTSTART <-> trigg ; DURATION = 0 ; TRIGGER = 0 .
module.exports = Alarm = americano.getModel 'Alarm',
    action       : type : String, default: 'DISPLAY' # One of DISPLAY, EMAIL, BOTH.
    trigg        : type : String # DT to trigger at. As UTC if ponctual. If recurent, to interpret in @timezone.
    description  : type : String
    timezone     : type : String # Timezone of trig time (if recurent)
    timezoneHour : type : String # deprecated.
    rrule        : type : String # recurence rules.
    tags         : type : (x) -> x # DAMN IT JUGGLING
    related      : type : String, default: null


require('cozy-ical').decorateAlarm Alarm

# TODO: migration script.
# # TODO: avoid duplication (Event and Alarm models.)
# insinuatingUTCToISO8601 = (dateStr) ->
#     # Skip buggy or empty values.
#     if not dateStr
#         return dateStr

#     # Check if it's already ISO8601
#     if (dateStr.charAt 10) == 'T'
#         return dateStr

#     d = dateStr
#     # Check for a timezone
#     if "GMT" not in dateStr
#         d = d + " GMT+0000"

#     return new Date(d).toISOString()

# Alarm.afterInitialize = () ->
#     @trigg = insinuatingUTCToISO8601(@trigg)

#     @


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

# # before sending to the client
# # set the trigg in TZ time
# Alarm::timezoned = (timezone) ->
#     throw new Error "buggy alarm" + @id if not @trigg
#     timezone ?= User.timezone
#     timezonedDate = new time.Date @trigg, 'UTC'
#     timezonedDate.setTimezone timezone
#     @timezone ?= timezone
#     @trigg = timezonedDate.toString().slice(0, 24)
#     return @

# # before saving
# # take an attributes object
# # set the trigg to UTC
# # store the TZed trigg in timezoneHour
# # @TODO : handling TZ clientside would be better
# Alarm.toUTC = (attrs, timezone) ->
#     timezone ?= User.timezone

#     if attrs.timezoneHour # popover save
#         if attrs.id
#             trigg = new time.Date attrs.trigg, User.timezone
#             trigg.setTimezone attrs.timezone
#         else
#             trigg = new time.Date attrs.trigg, attrs.timezone

#         [hours, minutes] = attrs.timezoneHour.split(':')
#         trigg.setHours(hours)
#         trigg.setMinutes(minutes)

#     else # D&D in the interface
#         trigg = new time.Date(attrs.trigg, User.timezone)
#         trigg.setTimezone(attrs.timezone)

#     attrs.timezoneHour = trigg.toString().slice(16, 21)
#     trigg.setTimezone('UTC')
#     attrs.trigg = trigg.toString().slice(0, 24)
#     return attrs