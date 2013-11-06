time = require 'time'
User = require '../models/user'
Alarm = require '../models/alarm'

module.exports.fetch = (req, res, next, id) ->
    Alarm.find id, (err, alarm) =>
        if err or not alarm
            res.send error: true, msg: "Alarm not found", 404
        else
            req.alarm = alarm
            next()

module.exports.all = (req, res) ->
    Alarm.all (err, alarms) =>
        if err
            res.send error: 'Server error occurred while retrieving data'
        else
            for alarm, index in alarms
                alarms[index] = alarm.timezoned(User.timezone)
            res.send alarms

module.exports.read = (req, res) ->
    res.send req.alarm.timezoned()

module.exports.create = (req, res) ->
    data = Alarm.toUTC req.body
    Alarm.create data, (err, alarm) =>
        if err
            res.send error: "Server error while creating alarm.", 500
        else
            alarm = alarm.timezoned(User.timezone)
            res.send alarm, 201

module.exports.update = (req, res) ->
    data = Alarm.toUTC req.body
    req.alarm.updateAttributes data, (err, alarm) =>
        if err?
            res.send error: "Server error while saving alarm", 500
        else
            alarm = alarm.timezoned(User.timezone)
            res.send alarm, 200

module.exports.delete = (req, res) ->
    req.alarm.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the alarm", 500
        else
            res.send success: true, 200

