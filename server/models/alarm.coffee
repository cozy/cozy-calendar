americano = require 'americano-cozy'
time = require 'time'
moment = require 'moment'
momentTz = require 'moment-timezone'
User = require './user'

module.exports = Alarm = americano.getModel 'Alarm',
    action       : type : String, default: 'DISPLAY'
    trigg        : type : String
    description  : type : String
    timezone     : type : String
    timezoneHour : type : String
    rrule        : type : String
    tags         : type : (x) -> x # DAMN IT JUGGLING
    related      : type : String, default: null


require('cozy-ical').decorateAlarm Alarm

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

Alarm::getCouchDate = ->
    @timezone ?= User.timezone

    momentTz(@trigg)
        .tz(@timezone)
        .tz('UTC')
        .format('YYYY-MM-DDThh:mm:ss.000') + 'Z'

# before sending to the client
# set the trigg in TZ time
Alarm::timezoned = (timezone) ->
    throw new Error "buggy alarm" + @id if not @trigg
    timezone ?= User.timezone
    timezonedDate = new time.Date @trigg, 'UTC'
    timezonedDate.setTimezone timezone
    @timezone ?= timezone
    @trigg = timezonedDate.toString().slice(0, 24)
    return @

# before saving
# take an attributes object
# set the trigg to UTC
# store the TZed trigg in timezoneHour
# @TODO : handling TZ clientside would be better
Alarm.toUTC = (attrs, timezone) ->
    timezone ?= User.timezone

    if attrs.timezoneHour # popover save
        if attrs.id
            trigg = new time.Date attrs.trigg, User.timezone
            trigg.setTimezone attrs.timezone
        else
            trigg = new time.Date attrs.trigg, attrs.timezone

        [hours, minutes] = attrs.timezoneHour.split(':')
        trigg.setHours(hours)
        trigg.setMinutes(minutes)

    else # D&D in the interface
        trigg = new time.Date(attrs.trigg, User.timezone)
        trigg.setTimezone(attrs.timezone)

    attrs.timezoneHour = trigg.toString().slice(16, 21)
    trigg.setTimezone('UTC')
    attrs.trigg = trigg.toString().slice(0, 24)
    return attrs
