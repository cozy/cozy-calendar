{AlarmCollection} = require '../collections/alarms'
{Alarm} = require './alarm'

class exports.Reminder extends Backbone.Model

    constructor: (attributes, options) ->

        @alarms = new AlarmCollection()
        super attributes, options

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



