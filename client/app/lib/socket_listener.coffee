class SocketListener extends CozySocketListener

    models:
        'event': require 'models/event'
        'contact': require 'models/contact'

    events: [
        'event.create', 'event.update', 'event.delete'
        'contact.create', 'contact.update', 'contact.delete'
    ]

    constructor: ->
        super
        @queue = async.queue @handleModel, 1

    handleModel: (model, next) =>
        model.fetch
            success: (fetched) =>
                if fetched.get('docType') isnt 'event'
                    @onRemoteCreateOrUpdate fetched
                else
                    start = moment(fetched.get('start')).format('YYYY-MM')
                    if window.app.mainStore.loadedMonths[start]
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
                for collection in @collections when model = collection.get id
                    model.trigger 'destroy', model, model.collection, {}


    onRemoteCreateOrUpdate: (fetched) ->
        for collection in @collections
            if fetched instanceof collection.model
                console.log('D')
                collection.add fetched, {merge: true}


module.exports = new SocketListener()
