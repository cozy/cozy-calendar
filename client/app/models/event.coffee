ScheduleItem = require './scheduleitem'

module.exports = class Event extends ScheduleItem

    startDateField: 'start'    
    endDateField: 'end'
    urlRoot: 'events'

   
    validate: (attrs, options) ->

        errors = []

        if not attrs.description
            errors.push
                field: 'description'
                value: "A description must be set."

        if not attrs.place
            errors.push
                field: 'place'
                value: "An Place must be set."

        if not attrs.start or not new Date.create(attrs.start).isValid()
            errors.push
                field: 'startdate'
                value: "The date or time format might be invalid. " + \
                        "It must be dd/mm/yyyy and hh:mm."

        if not attrs.end or not new Date.create(attrs.end).isValid()
            errors.push
                field: 'enddate'
                value: "The date or time format might be invalid. " + \
                        "It must be dd/mm/yyyy and hh:mm."

        ###if attrs.start > attrs.end
            console.log "pb start - end"
            errors.push
                field: 'date'
                value: "The start date might be inferor than end date  " + \
                        "It must be dd/mm/yyyy and hh:mm."###

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