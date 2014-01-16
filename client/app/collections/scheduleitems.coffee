module.exports = class ScheduleItemsCollection extends Backbone.Collection

    model: require '../models/scheduleitem'
    comparator: (si1, si2) ->

        t1 = si1.getDateObject().getTime()
        t2 = si2.getDateObject().getTime()

        if t1 < t2 then return -1
        else if t1 is t2 then return 0
        else return 1

    getFCEventSource: (tags) =>
        return (start, end, callback) =>
            eventsInRange = []
            @each (item) ->
                itemStart = item.getStartDateObject()
                itemEnd = item.getEndDateObject()
                duration = itemEnd - itemStart

                tag = tags.findWhere label: item.getCalendar()
                return null if tag and tag.get('visible') is false

                if rrule = item.getRRuleObject()
                    for rdate in rrule.between Date.create(start - duration), end
                        eventsInRange.push item.toFullCalendarEvent rdate

                else if item.isInRange start, end
                    eventsInRange.push item.toFullCalendarEvent()

            callback eventsInRange