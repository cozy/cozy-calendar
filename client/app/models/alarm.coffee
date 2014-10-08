helpers = require '../helpers'
ScheduleItem = require './scheduleitem'

module.exports = class Alarm extends ScheduleItem

    fcEventType: 'alarm'
    startDateField: 'trigg'
    urlRoot: 'alarms'

    defaults: ->
        description: ''
        title: ''
        place: ''
        tags: ['my calendar']

    parse: (attrs) ->
        delete attrs.id if attrs.id is "undefined"
        return attrs

    validate: (attrs, options) ->

        errors = []

        unless attrs.description?
            errors.push
                field: 'description'
                value: "no summary"

        unless attrs.action in ['DISPLAY', 'EMAIL', 'BOTH']
            errors.push
                field: 'action'
                value: "invalid action"

        if not attrs.trigg or not Date.create(attrs.trigg).isValid()
            errors.push
                field: 'triggdate'
                value: "invalid trigg date"

        if errors.length > 0
            return errors

    getDefaultColor: -> '#00C67A'
