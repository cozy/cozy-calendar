BaseView = require '../lib/base_view'

module.exports = class EventView extends BaseView

    tagName: 'div'
    className: 'event'
    template: require './templates/import_event'

    getRenderData: ->
        _.extend @model.toJSON(),
            start: @model.getFormattedStartDate '{yyyy}/{MM}/{dd} {HH}:{mm}'
            end: @model.getFormattedEndDate '{yyyy}/{MM}/{dd} {HH}:{mm}'
