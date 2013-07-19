ScheduleItem = require './scheduleitem'

module.exports = class Event extends ScheduleItem

    startDateField: 'start'
    endDateField: 'end'
    urlRoot: 'events'


    validateDate = (attrs, options, errors) ->
        sendError = () ->
            console.log 'pb start - end'
            errors.push
                field: 'date'
                value: "The start date might be inferor than end date  " + \
                        "It must be dd/mm/yyyy and hh:mm."

        # Initialize date
        start = new Date(attrs.start)
        end = new Date(attrs.end)

        startDate = start.format('{yy}:{MM}:{dd}').split(":")
        endDate = end.format('{yy}:{MM}:{dd}').split(":")
        startHour = start.format('{HH}:{mm}').split(":")
        endHour = end.format('{HH}:{mm}').split(":")

        if startDate[0] is endDate[0] and startDate[1] is endDate[1] and
                startDate[2] is endDate[2]
                # Same day
            if startHour[0] > endHour[0]
                sendError()
            else if startHour[0] is endHour[0] and startHour[1] > endHour[1]
                sendError()
        else
            # Event on multiples days
            if startDate[0] > endDate[0]
                sendError()
            else if startDate[0]is endDate[0]
                if startDate[1] > endDate[1]
                    sendError()
                else if startDate[1] is endDate[1] and startDate[2] > endDate[2]
                    sendError()

    validate: (attrs, options) ->

        errors = []

        if not attrs.description
            errors.push
                field: 'description'
                value: "A description must be set."

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

        validateDate(attrs, options, errors)

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
