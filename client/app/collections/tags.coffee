module.exports = class Tags extends Backbone.Collection

    url: 'tags'
    model: class Tag extends Backbone.Model
        idAttribute: 'label'
        defaults: visible: true
        toString: -> @get 'label'

    initialize: ->
        @alarmCollection = app.alarms
        @eventCollection = app.events

        @listenTo @alarmCollection, 'add', @onBaseCollectionAdd
        @listenTo @alarmCollection, 'change:tags', @onBaseCollectionChange
        @listenTo @alarmCollection, 'remove', @onBaseCollectionRemove
        @listenTo @alarmCollection, 'reset', @resetFromBase

        @listenTo @eventCollection, 'add', @onBaseCollectionAdd
        @listenTo @eventCollection, 'change:tags', @onBaseCollectionChange
        @listenTo @eventCollection, 'remove', @onBaseCollectionRemove
        @listenTo @eventCollection, 'reset', @resetFromBase

        @resetFromBase()

    resetFromBase: ->
        @reset []
        @alarmCollection.each (model) => @onBaseCollectionAdd model
        @eventCollection.each (model) => @onBaseCollectionAdd model

    onBaseCollectionChange: (model) ->
        @resetFromBase()

    onBaseCollectionAdd: (model) ->
        [calendar, tags...] = model.get 'tags'
        @add type: 'calendar', label:calendar
        @add type: 'tag', label:tag for tag in tags

    onBaseCollectionRemove: (model) ->
        @resetFromBase()

    parse: (raw) ->
        out = []
        out.push type:'calendar', label:tag for tag in raw.calendars
        out.push type:'tag',      label:tag for tag in raw.tags
        return out

    stringify = (tag) -> tag.toString()

    toArray: -> @map stringify
    calendars: -> @where(type:'calendar').map (tag) -> tag.attributes