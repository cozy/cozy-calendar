View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmPopOver = require './alarm_popover'
AlarmsListView = require '../views/alarms_list_view'
helpers = require '../helpers'

Alarm = require '../models/alarm'
alarmFormSmallTemplate = require('./templates/alarm_form_small')


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
            weekMode: 'liquid'
            aspectRatio: 2.031
            defaultView: 'month'
            columnFormat:
                month: 'dddd'
                week: 'ddd dd/MM'
                day: 'dddd dd/MM'
            timeFormat:
                '': 'HH:mm'
                'agenda': 'HH:mm{ - HH:mm}AR'
            axisFormat: 'HH:mm'
            buttonText:
                today: 'Today'
                month: 'Month'
                week: 'Week'
                day: 'Day'
            selectable: true
            selectHelper: false
            unselectAuto: false
            eventRender: @onRender
            viewDisplay: @deletePopOver
            select: @onSelect
            eventDragStop: @onEventDragStop
            eventDrop: @onEventDrop
            eventClick: @onEventClick
        @popover = new AlarmPopOver @cal

    onAdd: (alarm, alarms) ->
        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"
        endAlarm = alarm.getDateObject().clone()
        endAlarm.advance minutes: 60

        event =
            id: alarm.cid
            title: alarm.get 'description'
            start: alarm.getFormattedDate(Date.ISO8601_DATETIME)
            end: endAlarm.format(Date.ISO8601_DATETIME)
            allDay: false
            backgroundColor: '#5C5'
            borderColor: '#5C5'
            type: 'alarm' # non standard field

        @cal.fullCalendar 'addEventSource', [event]

    onReset: ->
        @model.forEach (item) => @onAdd item, @model

    onSelect: (startDate, endDate, allDay, jsEvent, view) =>
        @popover.clean()
        if view.name is "month"
            @handleSelectionInView startDate, endDate, allDay, jsEvent
        else if view.name is "agendaWeek"
            @handleSelectionInView startDate, endDate, allDay, jsEvent
        else if view.name is "agendaDay"
            @handleSelectionInView startDate, endDate, allDay, jsEvent, true

    onRender: (event, element) ->
        if event.type is 'alarm'
            selector = '.ui-resizable-handle.ui-resizable-s'
            $(element).find(selector).remove()

        if event.isSaving? and event.isSaving
            spinTarget = $(element).find('.fc-event-time')
            spinTarget.addClass 'spinning'
            spinTarget.html "&nbsp;"
            spinTarget.spin "tiny"

        return element

    onEventDragStop: (event, jsEvent, ui, view) -> event.isSaving = true

    onEventDrop: (event, dayDelta, minuteDelta, allDay,
                  revertFunc, jsEvent, ui, view) =>

        alarm = @model.get event.id
        alarm.getDateObject().advance
            days: dayDelta
            minutes: minuteDelta

        data = trigg: alarm.getFormattedDate Alarm.dateFormat
        alarm.save data,
            wait: true
            success: =>
                event.isSaving = false
                @cal.fullCalendar 'renderEvent', event
            error: ->
                event.isSaving = false
                @cal.fullCalendar 'renderEvent', event
                revertFunc()

    onEventClick: (event, jsEvent, view) =>
        target = $(jsEvent.currentTarget)

        eventStartTime = event.start.getTime()
        isDayView = view.name is 'agendaDay'
        direction = helpers.getPopoverDirection isDayView, event.start

        unless @popover.isExist? and
        @popover.action is 'edit' and
        @popover.date?.getTime() is eventStartTime

            @popover.createNew
                field: $(target)
                date: event.start
                action: 'edit'
                model: @model
                event: event

            formTemplate = alarmFormSmallTemplate
                editionMode: true
                defaultValue: event.title

            @popover.show "Alarm edition", direction, formTemplate

        @popover.bindEditEvents()

    handleSelectionInView: (startDate, endDate, allDay, jsEvent, isDayView) ->
        target = $(jsEvent.target)
        direction = helpers.getPopoverDirection isDayView, startDate

        @popover.createNew
            field: $(target)
            date: startDate
            action: 'create'
            model: @model

        alarmFormTemplate = alarmFormSmallTemplate
            editionMode: false
            defaultValue: ''

        @popover.show "Alarm creation", direction, alarmFormTemplate
        @popover.bindEvents startDate
