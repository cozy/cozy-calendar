ScheduleItem = require './scheduleitem'

module.exports = class Event extends ScheduleItem

    mainDateField: 'start'
    startDateField: 'start'
    endDateField: 'end'
    urlRoot: 'events'

    validate: (attrs, options) ->

        errors = []

        if not attrs.description
            errors.push
                field: 'description'
                value: "no description"

        if not attrs.start or not (start = Date.create(attrs.start)).isValid()
            errors.push
                field: 'startdate'
                value: "invalid start date"

        if not attrs.end or not (end = Date.create(attrs.end)).isValid()
            errors.push
                field: 'enddate'
                value: "invalid end date"

        if start.isAfter end
            errors.push
                field: 'date'
                value: "start after end"

        return errors if errors.length > 0

    #@TODO tags = color
    getColor: -> '#EB1'

    # Date object management
    initialize: ->
        @startDateObject = Date.create @get @startDateField
        @endDateObject = Date.create @get @endDateField
        @on 'change:start', =>
            @startDateObject = Date.create @get @startDateField
        @on 'change:end', =>
            @endDateObject = Date.create @get @endDateField

    getStartDateObject: -> @startDateObject
    getDateObject:      -> @startDateObject

    getFormattedStartDate: (formatter) -> @getStartDateObject().format formatter

    getEndDateObject: -> @endDateObject

    getFormattedEndDate: (formatter) -> @getEndDateObject().format formatter

    isOneDay: -> @startDateObject.short() is @endDateObject.short()

    # FullCalendar presenter
    toFullCalendarEvent: (trueStart) ->
        start = @getStartDateObject()
        end = @getEndDateObject()

        color = @getColor()

        if trueStart
            end = end.clone().advance trueStart - start
            start = trueStart

        return fcEvent =
            id: @cid
            title: "#{start.format "{HH}:{mm}"} #{@get("description")}"
            start: start.format Date.ISO8601_DATETIME
            end: end.format Date.ISO8601_DATETIME
            allDay: false
            diff: @get "diff"
            place: @get 'place'
            type: 'event' # non standard field
            backgroundColor: color
            borderColor: color
