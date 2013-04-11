{AlarmCollection} = require '../collections/alarms'
{Alarm} = require './alarm'

class exports.Reminder extends Backbone.Model

    constructor: (attributes, options) ->

        @alarms = new AlarmCollection()
        super attributes, options

    validate: (attrs, options) ->

        errors = []
        if not attrs.description or attrs.description is ""
            errors.push
                field: 'description'
                value: "The descript must be set."

        tempCollection = new AlarmCollection(attrs.alarms)
        tempCollection.forEach (alarm) ->
            if not alarm.isValid()
                errors.push
                    field: 'alarms'
                    value: alarm.validationError[0].value

        if errors.length > 0
            return errors

    set: (key, val, options) ->

        if key is 'alarms' or (key? and key.alarms?)
            if key is 'alarms'
                alarmList = val
            else
                alarmList = key.alarms

            for alarm, index in alarmList
                reminderID = @get 'id'
                alarm.index = index
                alarm.reminderID = reminderID if reminderID?

            @alarms.reset(alarmList)

        super key, val, options

    parse: (response, options) ->

        if response.alarms?
            for alarm, index in response.alarms
                alarm.reminderID = response.id
                alarm.index = index
            @alarms.reset response.alarms

        return super response, options




