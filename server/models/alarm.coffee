americano = require 'americano-cozy'
time = require 'time'
User = require './user'

module.exports = Alarm = americano.getModel 'Alarm',
    action       : type : String, default: 'DISPLAY'
    trigg        : type : String
    description  : type : String
    timezone     : type : String
    timezoneHour : type : String
    related      : type : String, default: null


require('cozy-ical').decorateAlarm Alarm

Alarm.all = (params, callback) ->
    Alarm.request "all", params, callback

# before sending to the client
# set the trigg in TZ time
Alarm::timezoned = (timezone) ->
    timezone = timezone or User.timezone
    timezonedDate = new time.Date @trigg, 'UTC'
    timezonedDate.setTimezone timezone
    @timezone ?= timezone
    @trigg = timezonedDate.toString().slice(0, 24)
    return @

# before saving
# take an attributes object
# if the object has a TZ, the trigg is considered to be in this TZ
# else we use the User's TZ
# set the trigg to UTC
# store the TZed trigg in timezoneHour
Alarm.toUTC = (attrs) ->
    attrs.timezone = attrs.timezone or User.timezone
    trigg = new time.Date(attrs.trigg, attrs.timezone)
    attrs.timezoneHour = trigg.toString().slice(16, 21)
    trigg.setTimezone('UTC')
    attrs.trigg = trigg.toString().slice(0, 24)
    return attrs