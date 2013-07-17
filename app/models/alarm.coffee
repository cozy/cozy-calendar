time = require 'time'
moment = require 'moment'
{VCalendar, VTodo, VAlarm} = require '../../lib/ical_helpers'


module.exports = (compound, Alarm) ->

    Alarm.all = (params, callback) ->
        Alarm.request "all", params, callback

    Alarm.getICalCalendar = ->
        new VCalendar 'Cozy Cloud', 'Cozy Agenda'

    Alarm::toIcal = (user, timezone) ->
        date = new time.Date @trigg
        date.setTimezone timezone, false
        vtodo = new VTodo date, user, @description
        vtodo.addAlarm date
        vtodo
