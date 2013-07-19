View = require '../lib/view'

module.exports = class AlarmView extends View

    tagName: 'div'
    className: 'alarm'

    initialize: ->
        @listenTo @model, "change", @onChange

    render: ->
        super
            action: @model.get 'action'
            time: @model.getFormattedDate '{HH}:{mm}'
            description: @model.get 'description'
            alarmID: @model.id

    template: ->
        require './templates/alarm'

    onChange: (alarm) ->
        @render()
