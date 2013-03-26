View = require '../lib/view'
ReminderView = require './reminder_view'

module.exports = class RemindersView extends View

    el: '#reminders'

    initialize: ->
        @listenTo @model, "add", @onAdd
        @listenTo @model, "remove", @onRemove
        @listenTo @model, "move", @onMove
        @listenTo @model, "reset", @onReset

        @views = {}

    onAdd: (reminder) ->
        console.log "new item added"
        reminderView = new ReminderView
            model: reminder
            id: reminder.id

        @views[reminder.id] = reminderView

        @$el.append reminderView.render().$el

    onRemove: (reminder) =>
        console.log "item removed"
        @views[reminder.id].remove()
        delete @views[reminder.id]

    onMove: (event) =>
        console.log "item moved"

    onReset: (event) =>
        console.log "collection reset"

    loadData: ->
        @model.fetch
            success: ->
                console.log "fetch with success"
            error: ->
                @$el.append($('<p>Server internal error.</p>'))
    render: ->

        @model.forEach (item) =>
            @onAdd item



