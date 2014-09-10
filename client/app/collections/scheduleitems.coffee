module.exports = class ScheduleItemsCollection extends Backbone.Collection

    model: require '../models/scheduleitem'
    comparator: (si1, si2) -> si1.getDateObject().diff(si2.getDateObject()) # moment.

        # t1 = si1.getDateObject().getTime()
        # t2 = si2.getDateObject().getTime()

        # if t1 < t2 then return -1
        # else if t1 is t2 then return 0
        # else return 1

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
                    item.getRecurrentFCEventBetween(start, end)
                # if rrule = item.getRRuleObject()
                    ;
                    # 20140904 TODO !
                    # for rdate in rrule.between Date.create(start - duration), end
                    #     eventsInRange.push item.toFullCalendarEvent rdate

                else if item.isInRange start, end
                    eventsInRange.push item.toPunctualFullCalendarEvent()

            callback eventsInRange