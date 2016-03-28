
addModel = (model, callback) =>
    return if window.app.events.get model.id

    model.fetch
        success: (fetched) =>
            addModel = ->
                for collection in model.collections
                    if model instanceof collection.model
                        collection.add model, sort: false

            if model.collections?
                if fetched.get('docType') is 'event'
                    start = moment(fetched.get('start')).format('YYYY-MM')
                    if window.app.mainStore.loadedMonths[start]
                        addModel()
                else
                    addModel()


            setTimeout callback, 50

        error: ->
            setTimeout callback, 50


class SocketListener extends CozySocketListener

    models:
        'event': require 'models/event'

    events: [
        'event.create', 'event.update', 'event.delete'
    ]

    queue: async.queue addModel, 1


    process: (event) ->
        {doctype, operation, id} = event
        switch operation
            when 'create'
                @onRemoteCreate doctype, id

            when 'update'
                if model = @singlemodels.get id
                    model.fetch
                        success: (fetched) =>
                            if fetched.changedAttributes()
                                @onRemoteUpdate fetched, null

                @collections.forEach (collection) =>
                    return unless model = collection.get id
                    model.fetch
                        success: (fetched) =>
                            if fetched.changedAttributes()
                                @onRemoteUpdate fetched, collection

            when 'delete'
                if model = @singlemodels.get id
                    @onRemoteDelete model, @singlemodels

                @collections.forEach (collection) =>
                    return unless model = collection.get id
                    @onRemoteDelete model, collection


    onRemoteCreate: (docType, id) ->
        return unless @shouldFetchCreated(id)
        model = new @models[docType](id: id)
        model.collections = @collections
        @queue.push model


    onRemoteDelete: (model) ->
        model.trigger 'destroy', model, model.collection, {}


module.exports = new SocketListener()
