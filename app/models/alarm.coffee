time = require 'time'
moment = require 'moment'
{VCalendar, VTodo, VAlarm, VTimezone, VStandard, VDaylight} = require '../../lib/ical_helpers'

module.exports = (compound, Alarm) ->

    Alarm.all = (params, callback) ->
        Alarm.request "all", params, callback

    require('cozy-ical/lib/alarm')(Alarm)