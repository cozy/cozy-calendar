class SocketListener extends CozySocketListener

    models:
        'alarm': require 'models/alarm'

    events: ['alarm.create','alarm.update', 'alarm.delete']

    onRemoteCreate: (alarm) ->
        @collection.add alarm

    onRemoteDelete: (alarm) ->
        @collection.remove alarm


module.exports = new SocketListener()