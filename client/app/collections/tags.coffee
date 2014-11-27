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

    # Overrides backbone behaviour
    # Removes a calendar (<=> removes all its events)
    remove: (calendarName, callback) ->
        eventsToRemove = @eventCollection.getByCalendar calendarName
        # removes all calendar's events 5 by 5
        async.eachLimit eventsToRemove, 5,  (event, done) ->
            event.destroy
                wait: true
                error: done.bind null, t('server error occured')
                success: done
        , callback

    # Renames a calendar (<=> change all its events)
    rename: (oldName, newName, callback) ->
        eventsToChange = @eventCollection.getByCalendar oldName
        # updates the name of the calendar for all calendar's events, 5 by 5
        async.eachLimit eventsToChange, 5,  (event, done) ->
            tags = event.get 'tags'
            # Clones the array so a `change` event can be fired
            newTags = if tags? then [].concat(tags) else []
            newTags[0] = newName

            event.save tags: newTags,
                wait: true
                error: done.bind null, t('server error occured')
                success: done
        , callback

    parse: (raw) ->
        out = []
        out.push type: 'calendar', label: tag for tag in raw.calendars
        out.push type: 'tag',      label: tag for tag in raw.tags
        return out

    stringify = (tag) -> tag.toString()

    toArray: -> @map stringify
    calendars: -> @where(type:'calendar').map (tag) -> tag.attributes
