time = require 'time'
moment = require 'moment'
{VCalendar, VTodo, VAlarm} = require '../../lib/ical_helpers'


module.exports = (compound, Alarm) ->

    Alarm.all = (params, callback) ->
        Alarm.request "all", params, callback

    Alarm.getICalCalendar = ->
        calendar = new VCalendar 'Cozy Cloud', 'Cozy Agenda'

    Alarm::toIcal = (user, timezone) ->
        date = new time.Date @trigg
        date.setTimezone timezone, false
        vtodo = new VTodo date, user, @description
        vtodo.addAlarm date
        vtodo

    Alarm.fromIcal = (valarm) ->
        alarm = new Alarm()
        alarm.description = valarm.fields["SUMMARY"]
        date = valarm.fields["DSTAMP"]
        date = moment(date, "YYYYMMDDTHHmm00")
        triggerDate = new time.Date new Date(date), 'UTC'
        alarm.trigg = triggerDate.toString().slice(0, 24)
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
