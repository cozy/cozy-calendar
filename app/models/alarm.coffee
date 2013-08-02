time = require 'time'
moment = require 'moment'
{VCalendar, VTodo, VAlarm, VTimezone, VStandard, VDaylight} = require '../../lib/ical_helpers'


module.exports = (compound, Alarm) ->

    Alarm.all = (params, callback) ->
        Alarm.request "all", params, callback

    Alarm.getICalCalendar = ->
        calendar = new VCalendar 'Cozy Cloud', 'Cozy Agenda'

    Alarm::timezoneToIcal = () ->
        date = new time.Date @trigg
        vtimezone = new VTimezone date, @timezone
        vtimezone

    Alarm::toIcal = (user, timezone) ->
        date = new time.Date @trigg        
        date.setTimezone timezone, false
        vtodo = new VTodo date, user, @description
        vtodo.addAlarm date
        vtodo

    Alarm.fromIcal = (valarm, timezone) ->
        alarm = new Alarm()
        alarm.description = valarm.fields["SUMMARY"]
        date = valarm.fields["DTSTAMP"]
        date = moment(date, "YYYYMMDDTHHmm00")
        triggerDate = new time.Date new Date(date), 'UTC'
        if timezone?
            alarm.timezone = timezone
            triggerDate.setTimezone timezone
        alarm.trigg = triggerDate.toString().slice(0, 24)
        alarm

    Alarm.fromIcalTimezone = (vtimezone) ->
        vtimezone.fields["TZID"]

    Alarm.extractAlarms = (component, timezone) ->
        alarms = []
        walker = (component) ->
            if component.name is 'VTIMEZONE'
                timezone = Alarm.fromIcalTimezone component
            if component.name is 'VTODO'
                alarms.push Alarm.fromIcal component, timezone
            if component.subComponents?.length isnt 0
                for subComponent in component.subComponents
                    walker subComponent

        walker component
        alarms
