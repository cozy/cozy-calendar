class SocketListener extends CozySocketListener

    models:
        'event': require 'models/event'
        'contact': require 'models/contact'
        'sharing': require 'models/sharing'

    events: [
        'event.create', 'event.update', 'event.delete'
        'contact.create', 'contact.update', 'contact.delete'
        'sharing.create', 'sharing.update', 'sharing.delete'
    ]

    constructor: ->
        super
        @queue = async.queue @handleModel, 1


    onEvent: (event) ->
        start = moment(event.get('start')).format('YYYY-MM')
        #TODO: do not rely on window object
        if window.app.mainStore.loadedMonths[start]
            @onRemoteCreateOrUpdate event


    onSharing: (sharing) ->
        targets = sharing.get 'targets'
        currentUserIsTheRecipient = not targets.length
        rules = sharing.get 'rules'

        eventRule = (rule) -> rule.docType.toLowerCase() is 'event'
        if currentUserIsTheRecipient and rules and rules.find(eventRule)
            @onRemoteCreateOrUpdate sharing


    handleModel: (model, next) =>
        model.fetch
            success: (fetched) =>
                docType = fetched.get('docType')
                # generate specific handler name to avoid switch/case
                # onEvent, onSharing, etc.
                handler = 'on' +
                    docType.charAt(0).toUpperCase() +
                    docType.slice(1)

                if typeof @[handler] is 'function'
                    @[handler] fetched
                else
                    @onRemoteCreateOrUpdate fetched

                setTimeout next, 50

            error: ->
                setTimeout next, 50

    process: (event) ->
        {doctype, operation, id} = event
        switch operation
            when 'create'
                @queue.push new @models[doctype](id: id)

            when 'update'
                @queue.push new @models[doctype](id: id)

            when 'delete'
                for collection in @collections when collection.get id
                    model = collection.get id
                    model.trigger 'destroy', model, model.collection, {}

    # Todo : should not we be more specific at what we are listening and where
    # we insert it ?
    onRemoteCreateOrUpdate: (fetched) ->
        for collection in @collections
            if fetched instanceof collection.model
                collection.add fetched, {merge: true}


module.exports = new SocketListener()
