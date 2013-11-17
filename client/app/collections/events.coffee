ScheduleItemsCollection = require './scheduleitems'
Event = require '../models/event'

module.exports = class EventCollection extends ScheduleItemsCollection
    model: Event
    url: 'events'

    asFCEventSource: (start, end, callback) =>
        eventsInRange = []
        @each (event) ->
            eventStart = event.getStartDateObject()
            eventEnd = event.getEndDateObject()
            duration = eventEnd - eventStart

            if rrule = event.getRRuleObject()
                dates = rrule.between Date.create(start - duration), end

                for date in dates
                    eventsInRange.push event.toFullCalendarEvent date

            else
                inRange = eventStart.isBetween(start, end) or
                eventEnd.isBetween(start, end) or
                (eventStart.isBefore(start) and eventEnd.isAfter(end))

                eventsInRange.push event.toFullCalendarEvent() if inRange

        console.log eventsInRange
        callback eventsInRange