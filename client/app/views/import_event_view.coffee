BaseView = require '../lib/base_view'

module.exports = class EventView extends BaseView

    tagName: 'div'
    className: 'event'
    template: require './templates/import_event'

    getRenderData: ->
        _.extend @model.toJSON(),
            start: @model.getFormattedStartDate 'YYYY/MM/DD HH:mm' # Localized format ? L ? 'L LT' ?
            end: @model.getFormattedEndDate 'YYYY/MM/DD HH:mm'
