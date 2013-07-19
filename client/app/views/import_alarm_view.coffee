View = require '../lib/view'

module.exports = class AlarmView extends View

    tagName: 'div'
    className: 'alarm'

    render: ->
        super
            action: @model.get 'action'
            time: @model.getFormattedDate '{MM}/{dd}/{yyyy} {HH}:{mm}'
            description: @model.get 'description'

    template: ->
        require './templates/alarm_import'
