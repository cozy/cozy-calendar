time = require 'time'
log = require('printit')
    prefix: 'alarms'

User = require '../models/user'
Alarm = require '../models/alarm'


module.exports.fetch = (req, res, next, id) ->
    Alarm.find id, (err, alarm) ->
        if err or not alarm
            res.send error: true, msg: "Alarm not found", 404
        else
            req.alarm = alarm
            next()

module.exports.all = (req, res) ->
    Alarm.all (err, alarms) ->
        if err
            res.send error: 'Server error occurred while retrieving data'
        else
            for alarm, index in alarms
                alarms[index] = alarm.timezoned()
            res.send alarms

module.exports.read = (req, res) ->
    res.send req.alarm.timezoned()

# Create a new alarm. In case of import, it doesn't create the alarm if
# it already exists.
module.exports.create = (req, res) ->

    data = Alarm.toUTC req.body, req.body.timezone
    create = ->
        Alarm.create data, (err, alarm) ->
            if err
                res.send error: "Server error while creating alarm.", 500
            else
                alarm = alarm.timezoned()
                res.send alarm, 201

    if data.import
        alarm = new Alarm data
        trigg = alarm.getCouchDate()
        Alarm.request 'byDate', key: trigg, (err, alarms) ->
            if err
                console.log err
                create()
            else if alarms.length is 0
                create()
            else if data.description is alarms[0].description
                log.warn 'Alarm already exists, it was not created.'
                res.send alarms[0].timezoned(), 201
            else
                create()
    else
        create()

module.exports.update = (req, res) ->
    data = Alarm.toUTC req.body
    req.alarm.updateAttributes data, (err, alarm) =>
        if err?
            res.send error: "Server error while saving alarm", 500
        else
            alarm = alarm.timezoned()
            res.send alarm, 200

module.exports.delete = (req, res) ->
    req.alarm.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the alarm", 500
        else
            res.send success: true, 200

