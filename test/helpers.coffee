Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

Event = require '../server/models/event'
Alarm = require '../server/models/alarm'
User  = require '../server/models/user'

module.exports = helpers = {}

helpers.before = (done) ->
    start = require('../server')
    start 8888, (err, app, server) =>
        console.log "WE GET HERE"
        @server = server
        done()

helpers.after = (done) ->
    @server.close()
    done()

# Remove all the alarms
helpers.cleanDb = (callback) ->
    Alarm.destroyAll () ->
        Event.destroyAll () ->
            data =
                email: 'test@cozycloud.cc'
                password: 'password'
                timezone: 'Europe/Paris'
            User.create data, callback

# Get all the alarams
helpers.getAllEvents = (callback) ->
    Event.all callback

# Create an event from values
helpers.createEvent = (start, end, place, diff, description, callback) ->
    (callback) ->
        evt =
            start: start
            end: end
            place: place
            diff: diff
            description: description

        Event.create evt, callback

# Create an alarm from object
helpers.createEventFromObject = (data, callback) ->
    Event.create data, callback

helpers.getEventByID = (id, callback) ->
    Event.find id, callback

helpers.doesEventExist = (id, callback) ->
    Event.exists id, callback

helpers.getAllAlarms = (callback) ->
    Alarm.all callback

# Create an alarm from values
helpers.createAlarm = (action, description, trigger, timezone, callback) ->
    (callback) ->
        alarm =
            action: action
            description: description
            trigg: trigger
            timezone: timezone

        Alarm.create alarm, callback

# Create an alarm from object
helpers.createAlarmFromObject = (data, callback) ->
    Alarm.create data, callback

helpers.getAlarmByID = (id, callback) ->
    Alarm.find id, callback

helpers.doesAlarmExist = (id, callback) ->
    Alarm.exists id, callback
