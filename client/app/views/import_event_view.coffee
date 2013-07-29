View = require '../lib/view'

module.exports = class EventView extends View

    tagName: 'div'
    className: 'event'

    render: ->
        super
            start: @model.getFormattedStartDate '{MM}/{dd}/{yyyy} {HH}:{mm}'
            end: @model.getFormattedEndDate '{MM}/{dd}/{yyyy} {HH}:{mm}'
            description: @model.get 'description'
            place: @model.get 'place'

    template: ->
        require './templates/event_import'
