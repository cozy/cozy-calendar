View = require '../lib/view'
ReminderView = require './reminder_view'

{AlarmCollection} = require '../collections/alarms'

module.exports = class DayProgramView extends View

    tagName: 'div'
    className: 'dayprogram'

    initialize: ->
        @listenTo @model.alarms, "add", @onAdd
        @listenTo @model.alarms, "change", @onChange
        @listenTo @model.alarms, "remove", @onRemove

        @views = {}

    onAdd: (alarm, alarms) ->

        index = alarms.indexOf alarm

        id = alarm.get('reminderID') + alarm.getTimeHash()

        @getReminderView(id, index).model.add(alarm)

    getReminderView: (id, index) ->

        index = 0 unless index?

        if not @views[id]?
            alarmsOnSameObject = new AlarmCollection()
            rView = new ReminderView
                        id: id
                        model: alarmsOnSameObject

            @views[id] = rView
            render = rView.render().$el
            if index is 0
                @$el.find('.alarms').prepend render
            else if index is @model.alarms.length - 1
                @$el.find('.alarms').append render
            else
                selector = ".alarms .#{rView.className}:nth-of-type(#{index})"
                @$el.find(selector).before render
        else
            rView = @views[id]

        return rView

    onChange: (alarm, options) ->

        if alarm.previous('trigger') is alarm.get('trigger')
            id = alarm.get('reminderID') + alarm.getTimeHash()
            alarmToUpdate = @views[id].model.get(alarm.get('id'))
            alarmToUpdate.set alarm.toJSON()
        else
            id = alarm.get('reminderID') + alarm.getTimeHash()
            index = @model.alarms.indexOf alarm
            @getReminderView(id, index).model.add(alarm)
            oldID = alarm.get('reminderID') + alarm.getTimeHash(alarm.getPreviousDateObject())
            @getReminderView(oldID).remove alarm

    onRemove: (alarm, collection, options) ->
        if @model.alarms.length is 0
            @destroy()
        else
            id = alarm.get('reminderID') + alarm.getTimeHash()
            rView = @getReminderView(id)
            rView.model.remove(alarm)
            if rView.model.length is 0
                delete @views[id]

    render: ->
        super
            date: @model.get('date').toString 'dd/MM/yyyy'

    template: ->
        require './templates/dayprogram'