class SocketListener extends CozySocketListener

    models:
        'alarm': require 'models/alarm'

    events: ['alarm.create','alarm.update', 'alarm.delete']

    onRemoteCreate: (alarm) ->
        @collections[1].add alarm

    onRemoteDelete: (alarm) ->
        @collections[1].remove alarm


module.exports = new SocketListener()