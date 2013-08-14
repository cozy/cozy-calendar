View = require '../lib/view'

module.exports = class AlarmView extends View

    tagName: 'div'
    className: 'alarm'

    render: ->
        super
            action: @model.get 'action'
            time: @model.getFormattedDate '{yyyy}/{MM}/{dd} {HH}:{mm}'
            description: @model.get 'description'

    template: ->
        require './templates/alarm_import'
