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

    # initialize: ->
    #     super()

    #     if @get('start').length == 10
    #         @fullDay = true

    setStart: (setObj) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()


        @_setDate(setObj, sdo, @startDateField)

        # Check and put end after start.
        if sdo >= edo
            edo = sdo.clone().add('hour', 1)

            @set @endDateField, edo.toISOString()

    setEnd: (setObj) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        @_setDate(setObj, edo, @endDateField)

         # Check start is before end, and move start.
        if sdo >= edo
            sdo = edo.clone().add('hour', -1)

            @set @startDateField, sdo.toISOString()

    _setDate: (setObj, dateObj, dateField) ->
        for unit, value of setObj
            dateObj.set(unit, value)

        @set dateField, dateObj.toISOString()


    addToStart: (duration) ->
        @set @startDateField, @getStartDateObject().add(duration).toISOString()
        
    addToEnd: (duration) ->
        # Improvement : handle other add format.
        @set @endDateField, @getEndDateObject().add(duration).toISOString()

    validate: (attrs, options) ->

        errors = []

        if not attrs.description
            errors.push
                field: 'description'
                value: "no summary"

        if not attrs.start or not (start = moment(attrs.start)).isValid()
            errors.push
                field: 'startdate'
                value: "invalid start date"

        if not attrs.end or not (end = moment(attrs.end)).isValid()
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


