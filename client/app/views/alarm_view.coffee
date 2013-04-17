View = require '../lib/view'

module.exports = class AlarmView extends View

    tagName: 'div'
    className: 'alarm'

    events:
        'hover': 'onMouseOver'

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

    onMouseOver: (event) ->

        if event.type is 'mouseenter'
            @$('i').css 'display', 'inline-block'
        else
            @$('i').hide()