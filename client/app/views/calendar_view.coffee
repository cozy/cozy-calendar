View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmsListView = require '../views/alarmsList_view'

module.exports = class CalendarView extends View

    el: '#viewContainer'

    initialize: ->
        @caldata = {}

        @listenTo @model, 'add', @onAdd
        @listenTo @model, 'reset', @onReset

    template: ->
        require('./templates/calendarview')

    afterRender: ->

        @cal = @$('#alarms').calendario()

        @updateMonthYear()

        @$('#prev-month').click =>
            @cal.gotoPreviousMonth(@updateMonthYear)
        @$('#next-month').click =>
            @cal.gotoNextMonth(@updateMonthYear)
        @$('#go-today').click =>
            @cal.gotoNow(@updateMonthYear)

    updateMonthYear: =>
        @$('#current-month').html @cal.getMonthName()
        @$('#current-year').html @cal.getYear()

    onAdd: (alarm, alarms) ->

        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"

        @caldata[index] = content
        @cal.setData @caldata

    onReset: ->
        @model.forEach (item) =>
            @onAdd item, @model