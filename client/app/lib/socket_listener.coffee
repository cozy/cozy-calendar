class SocketListener extends CozySocketListener

    models:
        'event': require 'models/event'

    events: [
        'event.create','event.update', 'event.delete'
    ]

    onRemoteCreate: (model) ->
        for collection in @collections
            if model instanceof collection.model
                collection.add model

    onRemoteDelete: (model) ->
        model.trigger 'destroy', model, model.collection, {}


module.exports = new SocketListener()
