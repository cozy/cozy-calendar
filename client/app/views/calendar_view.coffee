View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmsListView = require '../views/alarmsList_view'

Alarm = require '../models/alarm'

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
                    today: 'Today'
                    month: 'Month'
                    week: 'Week'
                    day: 'Day'
                selectable: true
                selectHelper: true
                eventRender: (event, element) ->

                    # we don't want alarms to be resized
                    if event.type is 'alarm'
                        selector = '.ui-resizable-handle.ui-resizable-s'
                        $(element).find(selector).remove()

                    if event.isSaving? and event.isSaving
                        spinTarget = $(element).find('.fc-event-time')
                        spinTarget.addClass 'spinning'
                        spinTarget.html "&nbsp;"
                        spinTarget.spin "tiny"

                    return element

                eventDragStop: (event, jsEvent, ui, view) ->
                    #triggers the loading wheel
                    event.isSaving = true

                # Manage persistance when an edit action is performed
                eventDrop: (event, dayDelta, minuteDelta, allDay, \
                            revertFunc, jsEvent, ui, view) =>

                    alarm =  @model.get event.cid
                    alarm.getDateObject().advance
                                            days: dayDelta
                                            minutes: minuteDelta

                    data = {trigg: alarm.getFormattedDate Alarm.dateFormat}
                    alarm.save data,
                        wait: true
                        success: =>
                            event.isSaving = false
                            @cal.fullCalendar('renderEvent', event)
                        error: ->
                            event.isSaving = false
                            @cal.fullCalendar('renderEvent', event)
                            revertFunc()

                # To manage the selection
                select: (startDate, endDate, allDay, jsEvent, view) ->
                    console.log "select"
                    console.debug startDate, endDate, allDay


    onAdd: (alarm, alarms) ->

        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"

        endAlarm = alarm.getDateObject().clone()
        endAlarm.advance {minutes: 30}

        event =
            title: alarm.get 'description'
            start: alarm.getFormattedDate(Date.ISO8601_DATETIME)
            end: endAlarm.format(Date.ISO8601_DATETIME)
            allDay: false
            backgroundColor: '#5C5'
            borderColor: '#5C5'
            type: 'alarm' # non standard field
            cid: alarm.cid # non standard field

        @cal.fullCalendar 'addEventSource', [event]

    onReset: ->
        @model.forEach (item) =>
            @onAdd item, @model