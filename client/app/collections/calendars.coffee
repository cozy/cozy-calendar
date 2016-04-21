SocketListener = require '../lib/socket_listener'
Tag = require 'models/tag'
TagCollection = require 'collections/tags'
request = require 'lib/request'

stringify = (tag) -> tag.toString()

module.exports = class CalendarCollection extends TagCollection

    model: Tag


    initialize: ->
        @eventCollection = app.events

        #@listenTo @eventCollection, 'add', @onBaseCollectionAdd
       # @listenTo @eventCollection, 'change:tags', @onBaseCollectionChange
        #@listenTo @eventCollection, 'remove', @onBaseCollectionRemove
        #@listenTo @eventCollection, 'reset', @resetFromBase

        @resetFromBase()


    resetFromBase: ->
        @reset []
        @eventCollection.each (model) => @onBaseCollectionAdd model


    onBaseCollectionChange: (model) ->
        @resetFromBase()


    onBaseCollectionAdd: (model) ->
        [calendarName, tags...] = model.get 'tags'
        calendar = app.tags.getOrCreateByName calendarName
        @add calendar

        if calendar.isNew()
            app.tags.add calendar
            calendar.save()


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
        request.post 'events/delete', {calendarName}, (err) =>
            if err
                callback t('server error occured')
            else
                callback()


    # Renames a calendar (<=> change all its events)
    rename: (oldName, newName, callback) ->
        request.post 'events/rename-calendar', {oldName, newName}, (err) ->
            if err
                callback t('server error occured')
            else
                callback()


    toArray: ->
        @map stringify


    comparator: (a, b) ->
        aName = a.get 'name'
        bName = b.get 'name'
        return aName.localeCompare bName, {}, sensitivity: 'base'


    toAutoCompleteSource: ->
        return @map (tag) ->
            return _.extend
                label: tag.get 'name'
                value: tag.get 'name'
            , tag.attributes

