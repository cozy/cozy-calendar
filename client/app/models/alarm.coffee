helpers = require '../helpers'
ScheduleItem = require './scheduleitem'

module.exports = class Alarm extends ScheduleItem

    fcEventType: 'alarm'
    startDateField: 'trigg'
    urlRoot: 'alarms'

    parse: (attrs) ->
        delete attrs.id if attrs.id is "undefined"
        return attrs

    validate: (attrs, options) ->

        errors = []

        if not attrs.description or attrs.description is ""
            errors.push
                field: 'description'
                value: "no description"

        if not attrs.action in ['DISPLAY', 'EMAIL', 'BOTH']
            errors.push
                field: 'action'
                value: "invalid action"

        if not attrs.trigg or not Date.create(attrs.trigg).isValid()
            errors.push
                field: 'triggdate'
                value: "invalid trigg date"

        if errors.length > 0
            return errors

    getColor: -> '#00C67A'
