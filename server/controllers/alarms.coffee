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
            res.send alarms

module.exports.read = (req, res) ->
    res.send req.alarm

# Create a new alarm. In case of import, it doesn't create the alarm if
# it already exists.
module.exports.create = (req, res) ->
    data = req.body
    data.created = moment().tz('UTC').toISOString()
    data.lastModification = moment().tz('UTC').toISOString()
    Alarm.createOrGetIfImport data, (err, alarm) =>
        if err
            res.send error: "Server error while creating alarm.", 500
        else
            res.send alarm, 201

module.exports.update = (req, res) ->
    data = req.body
    data.lastModification = moment().tz('UTC').toISOString()
    req.alarm.updateAttributes data, (err, alarm) =>
        if err?
            res.send error: "Server error while saving alarm", 500
        else
            res.send alarm, 200

module.exports.delete = (req, res) ->
    req.alarm.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the alarm", 500
        else
            res.send success: true, 200

