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
