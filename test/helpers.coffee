Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

module.exports = (compound) ->
    Alarm = compound.models.Alarm

    helpers = {}

    # Remove all the alarms
    helpers.cleanDb = (callback) ->
        Alarm.destroyAll callback

    # Get all the alarams
    helpers.getAllAlarms = (callback) ->
        Alarm.all callback

    # Create an alarm from values
    helpers.createAlarm = (action, description, trigger, callback) ->
        (callback) ->
            alarm =
                action: action
                description: description
                trigg: trigger

            Alarm.create alarm, callback

    # Create an alarm from object
    helpers.createAlarmFromObject = (data, callback) ->
        Alarm.create data, callback

    helpers.getAlarmByID = (id, callback) ->
        Alarm.find id, callback

    helpers
