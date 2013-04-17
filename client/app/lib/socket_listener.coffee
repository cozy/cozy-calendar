class SocketListener

    events: ['alarm.create','alarm.update', 'alarm.delete']

    stack: [],
    paused: false,


    constructor: (@collection) ->
        try
            @connect()
        catch err
            console.log "Error while connecting to socket.io"
            console.log err.stack

    pause: ->
        @paused = true

    resume: ->
        while @stack.length > 0
            @process @stack.shift()
        @paused = false

    connect: ->
        url = window.location.origin
        pathToSocketIO = "#{window.location.pathname.substring(1)}socket.io"
        socket = io.connect url,
                resource: pathToSocketIO

        for event in @events
            socket.on event, @callbackFactory(event)

    callbackFactory: (event) => (id) =>
        [doctype, operation] = event.split '.'
        fullevent = id: id, doctype: doctype, operation: operation

        if @paused then @stack.push fullevent
        else @process fullevent

    process: (event) ->
        {doctype, operation, id} = event
        console.log "socketio: #{operation}"
        switch operation
            when 'create'
                unless @collection.get id
                    alarm = new @collection.model id: id
                    console.log "fetching and adding to collection"
                    alarm.fetch(
                        success: =>
                            console.log "create alarm fetch success"
                            console.debug alarm
                            @collection.add alarm
                        error: ->
                            console.log "create alarm fetch error"
                        )
                else
                    console.log "shouldn't be added"

            when 'update'
                if alarm = @collection.get id
                    alarm.fetch()

            when 'delete'
                if alarm = @collection.get id
                    alarm.trigger 'destroy', alarm, @collection


module.exports = SocketListener