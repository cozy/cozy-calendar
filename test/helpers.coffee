Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

module.exports = (compound) ->
    Alarm = compound.models.Alarm

    helpers = {}

    # Remove all todolists and tree from DB.
    helpers.cleanDb = (callback) ->
        Alarm.destroyAll callback

    helpers.getAllAlarms = (callback) ->
        Alarm.all callback

    # Create a new todo list.
    helpers.createAlarm = (action, description, trigger) ->
        (callback) ->
            alarm =
                action: action
                description: description
                trigg: trigger

            Alarm.create alarm, callback

    helpers
