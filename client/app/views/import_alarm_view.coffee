BaseView = require '../lib/base_view'

module.exports = class AlarmView extends BaseView

    tagName: 'div'
    className: 'alarm'
    template: require './templates/import_alarm'

    getRenderData: ->
        _.extend @model.toJSON(),
            time: @model.getFormattedDate 'YYYY/MM/DD HH:mm'
            description: @model.get 'description'

