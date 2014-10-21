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

    getDiff: ->
        return @getEndDateObject().diff @getStartDateObject(), 'days'

    # Update start, with values in setObj, 
    # while ensuring that end stays after start.
    # @param setObj a object, with hour, minute, ... as key, and corrresponding
    # values, in the cozy's user timezone.
    setStart: (setObj) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        @_setDate(setObj, sdo, @startDateField)

        # Check and put end after start.
        if sdo >= edo
            edo = sdo.clone().add 1, 'hour'

            @set @endDateField, @_formatMoment edo

    # Same as update start, for end field.
    setEnd: (setObj) ->
        sdo = @getStartDateObject()
        edo = @getEndDateObject()

        @_setDate(setObj, edo, @endDateField)

        # Check start is before end, and move start.
        if sdo >= edo
            sdo = edo.clone().add -1, 'hour'

            @set @startDateField, @_formatMoment sdo

    _setDate: (setObj, dateObj, dateField) ->
        for unit, value of setObj
            dateObj.set unit, value

        @set dateField, @_formatMoment dateObj

    setDiff: (days) ->
        edo = @getStartDateObject().startOf 'day'
        edo.add days, 'day'
        
        if not @isAllDay()
            oldEnd = @getEndDateObject()
            edo.set 'hour', oldEnd.hour()
            edo.set 'minute', oldEnd.minute()

            # Check and put end after start.
            sdo = @getStartDateObject()
            if sdo >= edo
                edo = sdo.clone().add 1, 'hour'

        @set @endDateField, @_formatMoment edo

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
