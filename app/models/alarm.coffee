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

    Alarm.fromIcal = (valarm) ->
        alarm = new Alarm()
        alarm.description = valarm.fields["SUMMARY"]
        alarm.trigg = valarm.fields["DSTAMP"]
        alarm

    Alarm.extractAlarms = (component) ->
        alarms = []
        walker = (component) ->
            if component.name is 'VTODO'
                alarms.push Alarm.fromIcal component

            if component.subComponents?.length isnt 0
                for subComponent in component.subComponents
                    walker subComponent

        walker component
        alarms
