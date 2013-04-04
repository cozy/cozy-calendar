{AlarmCollection} = require '../collections/alarms'
{Alarm} = require './alarm'

class exports.Reminder extends Backbone.Model

    parse: (response, options) ->

        alarms = response.alarms?.slice 0 # cloning the array
        response.alarms = new AlarmCollection()

        if alarms?
            for rawAlarm, i in alarms
                rawAlarm.reminderID = response.id
                rawAlarm.index = i
                alarm = new Alarm rawAlarm
                response.alarms.add alarm


        return super response, options

