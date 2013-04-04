View = require '../lib/view'
ReminderView = require './reminder_view'

{AlarmCollection} = require '../collections/alarms'

module.exports = class DayProgramView extends View

    tagName: 'div'
    className: 'dayprogram'

    initialize: ->
        @listenTo @model.get('alarms'), "add", @onAdd

        @views = {}

    onAdd: (alarm, alarms) ->
        index = alarms.indexOf alarm

        id = alarm.get('reminderID') + alarm.getTimeHash()

        if not @views[id]?
            alarmsOnSameObject = new AlarmCollection()
            rView = new ReminderView
                        id: id
                        model: alarmsOnSameObject

            @views[id] = rView
        else
            rView = @views[id]

        rView.model.add(alarm)

        render = rView.render().$el
        if index is 0
            @$el.find('.alarms').prepend render
        else if index is alarms.length - 1
            @$el.find('.alarms').append render
        else
            selector = ".alarms .#{rView.className}:nth-of-type(#{index})"
            @$el.find(selector).before render

    render: ->
        super
            date: @model.get 'date'

    template: ->
        require './templates/dayprogram'