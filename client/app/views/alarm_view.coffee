BaseView = require '../lib/base_view'


module.exports = class AlarmView extends BaseView

    className: 'scheduleElement'
    template: require './templates/alarm'

    initialize: ->
        @listenTo @model, "change", @render

    getRenderData: ->
        action: @model.get 'action'
        time: @model.getDate '{HH}:{mm}'
        description: @model.get 'description'
        timezone: @model.get 'timezone'
        alarmID: @model.id
