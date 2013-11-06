time = require 'time'
User = require '../models/user'
Alarm = require '../models/alarm'

convertAlarmDate = (alarm, timezone) ->
    timezonedDate = new time.Date(alarm.trigg, 'UTC')
    timezonedDate.setTimezone(timezone)
    alarm.trigg = timezonedDate.toString().slice(0, 24)
    return alarm


module.exports.fetch = (req, res) ->
    Alarm.find req.params.id, (err, alarm) =>
        if err or not alarm
            res.send error: true, msg: "Alarm not found", 404
        else
            req.alarm = alarm
            next()

module.exports.all = (req, res) ->
    Alarm.all (err, alarms) =>
        return res.send error: 'Server error occurred while retrieving data' if err

        for alarm, index in alarms
            if !alarm.timezone? or alarm.timezone is null
                alarm.timezone = User.timezone
            alarms[index] = convertAlarmDate alarm, User.timezone
        res.send alarms

module.exports.read = (res, res) ->
    res.send convertAlarmDate req.alarm, req.timezone

module.exports.create = (req, res) ->
    body.timezone ?= User.timezone

    triggerDate = new time.Date(body.trigg, body.timezone)
    body.timezoneHour = triggerDate.toString().slice(16, 21)
    triggerDate.setTimezone('UTC')
    body.trigg = triggerDate.toString().slice(0, 24)


    Alarm.create body, (err, alarm) =>
        if err
            res.send error: true, msg: "Server error while creating alarm.", 500
        else
            alarm = convertAlarmDate req.alarm, body.timezone
            res.send alarm, 201

module.exports.update = (req, res) ->
    body.timezone ?= User.timezone

    triggerDate = new time.Date(req.body.trigg, body.timezone)
    body.timezoneHour = triggerDate.toString().slice(16, 21)
    triggerDate.setTimezone('UTC')
    req.body.trigg = triggerDate.toString().slice(0, 24)

    req.alarm.timezone = body.timezone
    req.alarm.updateAttributes body, (err, alarm) =>
        if err?
            res.send error: "Server error while saving alarm", 500
        else
            alarm = convertAlarmDate alarm, body.timezone
            res.send alarm, 200

module.exports.delete = (req, res) ->
    req.alarm.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the alarm", 500
        else
            res.send success: true, 200

