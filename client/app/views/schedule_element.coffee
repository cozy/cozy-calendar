View = require '../lib/view'

module.exports = class ScheduleElement extends View

    tagName: 'div'
    className: 'scheduleElement'

    initialize: ->
        @listenTo @model, "change", @onChange

    onChange: (alarm) ->
        @render()