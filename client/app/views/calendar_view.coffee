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

        @cal = @$('#alarms').fullCalendar
                header:
                    left: 'prev,next today'
                    center: 'title'
                    right: 'month,agendaWeek,agendaDay'
                editable: true
                firstDay: 1 # first day of the week is monday ffs
                columnFormat:
                    month: 'dddd'
                    week: 'ddd dd/MM'
                    day: 'dddd dd/MM'
                timeFormat:
                    '': 'HH:mm'
                axisFormat: 'HH:mm'
                buttonText:
                    today: 'Go today'
                    month: 'Month'
                    week: 'Week'
                    day: 'Day'


    onAdd: (alarm, alarms) ->

        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"

        @cal.fullCalendar 'addEventSource', (start, end, callback) ->

            endAlarm = alarm.getDateObject().clone()
            endAlarm.advance {minutes: 30}

            event =
                title: alarm.get 'description'
                start: alarm.getFormattedDate(Date.ISO8601_DATETIME)
                end: endAlarm.format(Date.ISO8601_DATETIME)
                allDay: false
                backgroundColor: '#5C5'
                borderColor: '#5C5'

            callback([event])


    onReset: ->
        @model.forEach (item) =>
            @onAdd item, @model