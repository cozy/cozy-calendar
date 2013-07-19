time = require 'time'
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
