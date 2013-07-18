ScheduleItem = require './scheduleitem'

module.exports = class Event extends ScheduleItem

    startDateField: 'start'    
    endDateField: 'end'
    urlRoot: 'events'

    validate: (attrs, options) ->
        errors = []

        if errors.length > 0
            return errors 

    getStartDateObject: ->
        if not @startDateObject?
            @startDateObject = new Date.create(@get(@startDateField))
        return @startDateObject

    getFormattedStartDate: (formatter) ->
        return @getStartDateObject().format formatter

    getEndDateObject: ->
        if not @endDateObject?
            @endDateObject = new Date.create(@get(@endDateField))
        return @endDateObject

    getFormattedEndDate: (formatter) ->
        return @getEndDateObject().format formatter