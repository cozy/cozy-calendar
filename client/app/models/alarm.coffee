helpers = require '../helpers'
ScheduleItem = require './scheduleitem'

module.exports = class Alarm extends ScheduleItem

    mainDateField: 'trigg'
    urlRoot: 'alarms'

    @dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00"

    validate: (attrs, options) ->

        errors = []

        if not attrs.description or attrs.description is ""
            errors.push
                field: 'description'
                value: "A description must be set."

        if not attrs.action or attrs.action is ""
            errors.push
                field: 'action'
                value: "An action must be set."

        if not attrs.action in ['DISPLAY', 'EMAIL']
            errors.push
                field: 'action'
                value: "A valid action must be set."

        if not attrs.trigg or not Date.create(attrs.trigg).isValid()
            errors.push
                field: 'triggdate'
                value: "The date or time format might be invalid. " + \
                        "It must be dd/mm/yyyy and hh:mm."

        if errors.length > 0
            return errors

    getColor: -> '#5C5'

    initialize: ->
        @dateObject = Date.create @get @mainDateField
        @on 'change:' + @mainDateField, =>
            @dateObject = Date.create @get @mainDateField

    getDateObject: -> @dateObject

    getRRuleObject: -> false

    toFullCalendarEvent: ->
        time = @getDateObject()
        end = time.clone().advance minutes: 30

        event =
            id: @cid
            title: "#{time.format "{HH}:{mm}"} #{@get("description")}"
            timezone: @get 'timezone'
            allDay: false
            start: time.format(Date.ISO8601_DATETIME)
            end: end.format(Date.ISO8601_DATETIME)
            type: 'alarm' # non standard field
            timezoneHour: @get 'timezoneHour'
            backgroundColor: @getColor()
            borderColor: @getColor()