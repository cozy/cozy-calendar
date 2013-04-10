Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

module.exports = (compound) ->
    VTodo = compound.models.VTodo

    helpers = {}

    # Remove all todolists and tree from DB.
    helpers.cleanDb = (callback) ->
        VTodo.destroyAll callback

    # Create a new todo list.
    helpers.createReminder = (description) ->
        (callback) ->
            alarm =
                action: 'DISPLAY'
                trigger: '20130410T130000Z'
                description: 'please remind me something'

            vtodo =
                description: description
                alarms: [alarm]

            VTodo.create vtodo, callback


    helpers
