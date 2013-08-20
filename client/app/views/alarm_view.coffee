ScheduleElement = require './schedule_element'

module.exports = class AlarmView extends ScheduleElement

    render: ->
        super
            action: @model.get 'action'
            time: @model.getDate '{HH}:{mm}'
            description: @model.get 'description'
            timezone: @model.get 'timezone'
            alarmID: @model.id

    template: ->
        require './templates/alarm'
