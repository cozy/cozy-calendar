ScheduleItem = require './scheduleitem'

module.exports = class Event extends ScheduleItem

    fcEventType: 'event'
    startDateField: 'start'
    endDateField: 'end'
    urlRoot: 'events'

    defaults: ->
        description: ''
        title: ''
        place: ''
        tags: ['my calendar']

    validate: (attrs, options) ->

        errors = []

        if not attrs.description
            errors.push
                field: 'description'
                value: "no summary"

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
    getDefaultColor: -> '#008AF6'
