module.exports = class ScheduleItemsCollection extends Backbone.Collection

    model: require '../models/scheduleitem'
    comparator: (si1, si2) -> si1.getDateObject().diff si2.getDateObject()

    getFCEventSource: (tags) =>
        return (start, end, timezone, callback) =>
            # start and end : ambiguous moments ; only dates if month or week view.

            eventsInRange = []
            @each (item) ->
                itemStart = item.getStartDateObject()
                itemEnd = item.getEndDateObject()
                duration = itemEnd - itemStart

                tag = tags.findWhere label: item.getCalendar()
                return null if tag and tag.get('visible') is false

                if item.isRecurrent()
                    eventsInRange = eventsInRange.concat(
                        item.getRecurrentFCEventBetween start, end)

                else if item.isInRange start, end
                    eventsInRange.push item.toPunctualFullCalendarEvent()

            callback eventsInRange

    getByCalendar: (calendarName) ->
        return @filter (event) -> event.get('tags')[0] is calendarName
