ScheduleItemsCollection = require './scheduleitems'
Alarm = require '../models/alarm'

module.exports = class AlarmCollection extends ScheduleItemsCollection

    model: Alarm
    url: 'alarms'

    asFCEventSource: (start, end, callback) =>
        eventsInRange = []
        @each (alarm) ->
            alarmTime = alarm.getDateObject()

            if rrule = alarm.getRRuleObject()
                dates = rrule.between start, end

                for date in dates
                    eventsInRange.push alarm.toFullCalendarEvent date

            else if alarmTime.isBetween(start, end)
                eventsInRange.push alarm.toFullCalendarEvent()

        callback eventsInRange