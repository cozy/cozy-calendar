SocketListener = require '../lib/socket_listener'

module.exports = class Tags extends Backbone.Collection

    url: 'tags'
    model: class Tag extends Backbone.Model
        idAttribute: 'label'
        defaults: visible: true
        toString: -> @get 'label'

    initialize: ->
        @eventCollection = app.events

        @listenTo @eventCollection, 'add', @onBaseCollectionAdd
        @listenTo @eventCollection, 'change:tags', @onBaseCollectionChange
        @listenTo @eventCollection, 'remove', @onBaseCollectionRemove
        @listenTo @eventCollection, 'reset', @resetFromBase

        @resetFromBase()

    resetFromBase: ->
        @reset []
        @eventCollection.each (model) => @onBaseCollectionAdd model

    onBaseCollectionChange: (model) ->
        @resetFromBase()

    onBaseCollectionAdd: (model) ->
        [calendar, tags...] = model.get 'tags'
        @add type: 'calendar', label: calendar
        @add type: 'tag', label: tag for tag in tags

    onBaseCollectionRemove: (model) ->
        @resetFromBase()

    _pauseModels: (models, options) ->
        models.forEach (model) ->
            SocketListener.pause model, null, options

    _resumeModels: (models, options) ->
        models.forEach (model) ->
            SocketListener.resume model, null, options

    # Overrides backbone behaviour
    # Removes a calendar (<=> removes all its events)
    remove: (calendarName, callback) ->
        eventsToRemove = @eventCollection.getByCalendar calendarName
        # Pause real time for models to be removed
        options = ignoreMySocketNotification: true
        @_pauseModels eventsToRemove, options
        $.ajax 'events/delete',
            type: 'DELETE'
            data: {calendarName}
            success: =>
                @eventCollection.remove eventsToRemove
                callback()
                # Resume real time for models that have changed
                # It takes a noticeable time so we do it after the callback call
                @_resumeModels eventsToRemove, options
            error: =>
                @_resumeModels eventsToRemove, options
                callback t('server error occured')

    # Renames a calendar (<=> change all its events)
    rename: (oldName, newName, callback) ->
        # Pause real time for models to be changed
        options = ignoreMySocketNotification: true
        eventsToChange = @eventCollection.getByCalendar oldName
        @_pauseModels eventsToChange, options

        $.ajax 'events/rename-calendar',
            type: 'POST'
            data: {oldName, newName}
            success: (data) =>
                @eventCollection.add data, merge: true
                callback()
                # Resume real time for models that have changed
                # It takes a noticeable time so we do it after the callback call
                @_resumeModels eventsToChange, options
            error: =>
                @_resumeModels eventsToChange, options
                callback t('server error occured')


    parse: (raw) ->
        out = []
        out.push type: 'calendar', label: tag for tag in raw.calendars
        out.push type: 'tag',      label: tag for tag in raw.tags
        return out

    stringify = (tag) -> tag.toString()

    toArray: -> @map stringify
    calendars: -> @where(type:'calendar').map (tag) -> tag.attributes
