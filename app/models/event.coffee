time = require 'time'
moment = require 'moment'
{VCalendar, VEvent} = require '../../lib/ical_helpers'

module.exports = (compound, Event) ->

    Event.all = (params, callback) ->
        Event.request "all", params, callback

    Event::toIcal = (user, timezone) ->
        startDate = new time.Date @start
        endDate = new time.Date @end
        startDate.setTimezone timezone, false
        endDate.setTimezone timezone, false
        new VEvent startDate, endDate, @description, @place

    Event.fromIcal = (vevent) ->
        event = new Event()
        event.description = vevent.fields["DESCRIPTION"]
        event.place = vevent.fields["LOCATION"]
        startDate = vevent.fields["DTSTART"]
        startDate = moment startDate, "YYYYMMDDTHHmm00"
        endDate = vevent.fields["DTEND"]
        endDate = moment endDate, "YYYYMMDDTHHmm00"
        event.start = startDate
        event.end = endDate
        event

    Event.extractEvents = (component) ->
        events = []
        walker = (component) ->
            events.push Event.fromIcal component if component.name is 'VEVENT'

            if component.subComponents?.length isnt 0
                for subComponent in component.subComponents
                    walker subComponent

        walker component
        events
