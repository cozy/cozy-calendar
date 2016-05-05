module.exports = class ScheduleItemsCollection extends Backbone.Collection

    model: require '../models/scheduleitem'
    comparator: (si1, si2) -> si1.getDateObject().diff si2.getDateObject()

    # The calendar tag for all event was referencing the same instance
    # in every event object. This is not the case anymore, so we have
    # to check every event calendar in the a given calendars collection
    # to verify the visibility
    visibleItems: (calendars) ->
        new ScheduleItemsCollection @filter (item) ->
            calendar = calendars.get item.getCalendar()?.get('id')
            return calendar?.get 'visible'


    getFCEventSource: (calendars) =>
        return (start, end, timezone, callback) =>
            # start and end : ambiguous moments
            # only dates if month or week view.
            eventsInRange = []

            @visibleItems(calendars)?.each (item) ->
                itemStart = item.getStartDateObject()
                itemEnd = item.getEndDateObject()
                duration = itemEnd - itemStart

                if item.isRecurrent()
                    try
                        eventsInRange = eventsInRange.concat(
                            item.getRecurrentFCEventBetween start, end)
                    catch e
                        console.error e
                        # sometime the RRule is badly formated, so we try to
                        # at least display the first item
                        if item.isInRange start, end
                            eventsInRange.push(
                                item.toPunctualFullCalendarEvent())

                else if item.isInRange(start, end)
                    eventsInRange.push item.toPunctualFullCalendarEvent()

            callback eventsInRange

    getByCalendar: (calendarName) ->
        return @filter (event) -> event.get('tags')[0] is calendarName
