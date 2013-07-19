View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmPopOver = require './alarm_popover'
AlarmsListView = require '../views/alarms_list_view'
EventPopOver = require './event_popover'
helpers = require '../helpers'

Alarm = require '../models/alarm'
Event = require '../models/event'
alarmFormSmallTemplate = require('./templates/alarm_form_small')
eventFormSmallTemplate = require('./templates/event_form_small')


module.exports = class CalendarView extends View

    el: '#viewContainer'

    initialize: (alarm, evt) ->
        @caldata = {}

        @modelAlarm = alarm
        @modelEvent = evt 
        @listenTo @modelAlarm, 'add', @onAddAlarm
        @listenTo @modelAlarm, 'reset', @onResetAlarm
        @listenTo @modelEvent, 'add', @onAddEvent
        @listenTo @modelEvent, 'reset', @onResetEvent

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
                'agenda': 'HH:mm{ - HH:mm}'
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
        @popoverEvent = new EventPopOver @cal

    onAddAlarm: (alarm, alarms) ->
        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"
        endAlarm = alarm.getDateObject().clone()
        endAlarm.advance minutes: 30

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


    onResetAlarm: ->
        @modelAlarm.forEach (item) => @onAddAlarm item, @modelAlarm

    onAddEvent: (evt, events) ->
        index = evt.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = evt.get("start")
        content = "#{time} #{evt.get("description")}"
        endEvt = evt.get("end")

        event =
            id: evt.cid
            title: evt.get 'description'
            start: evt.getFormattedStartDate(Date.ISO8601_DATETIME)
            end: evt.getFormattedEndDate(Date.ISO8601_DATETIME)
            diff: evt.get "diff"
            place: evt.get 'place'
            allDay: false
            backgroundColor: '#EB1'
            borderColor: '#EB1'
            type: 'event' # non standard field

        @cal.fullCalendar 'addEventSource', [event]

    onResetEvent: ->
        @modelEvent.forEach (item) => @onAddEvent item, @modelEvent

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

        if event.type is 'event'
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

        if event.type is 'alarm'
            alarm = @modelAlarm.get event.id
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
        else
            evt = @modelEvent.get event.id
            evt.getStartDateObject().advance
                days: dayDelta
                minutes: minuteDelta

            evt.getEndDateObject().advance
                days: dayDelta
                minutes: minuteDelta
            data = 
                start: evt.getFormattedStartDate Event.dateFormat
                end: evt.getFormattedEndDate Event.dateFormat
            evt.save data,
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

        if event.type is 'alarm'
            @popoverEvent.clean()
            unless @popover.isExist? and
            @popover.action is 'edit' and
            @popover.date?.getTime() is eventStartTime

                @popover.createNew
                    field: $(target)
                    date: event.start
                    action: 'edit'
                    model: @modelAlarm
                    event: event

                formTemplate = alarmFormSmallTemplate
                    editionMode: true
                    defaultValue: event.title

                @popover.show "Alarm edition", direction, formTemplate

            @popover.bindEditEvents()
        else
            @popover.clean()
            unless @popoverEvent.isExist? and
            @popoverEvent.action is 'edit' and
            @popoverEvent.date?.getTime() is eventStartTime

                @popoverEvent.createNew
                    field: $(target)
                    date: event.start
                    action: 'edit'
                    model: @modelEvent
                    event: event

                startDate = event.start.format('{yy}:{MM}:{dd}').split(":")
                endDate = event.end.format('{yy}:{MM}:{dd}').split(":")
                diff = event.diff
                defaultValueEnd = event.end.format('{HH}:{mm}') + "+" + diff

                formTemplate = eventFormSmallTemplate
                    editionMode: true
                    defaultValueStart: event.start.format('{HH}:{mm}')
                    defaultValueEnd: defaultValueEnd
                    defaultValuePlace: event.place
                    defaultValueDesc: event.title


                @popoverEvent.show "Event edition", direction, formTemplate

            @popoverEvent.bindEditEvents()

    handleSelectionInView: (startDate, endDate, allDay, jsEvent, isDayView) ->
        target = $(jsEvent.target)
        direction = helpers.getPopoverDirection isDayView, startDate

        @popover.createNew
            field: $(target)
            date: startDate
            action: 'create'
            model: @modelAlarm
            modelEvent: @modelEvent

        alarmFormTemplate = alarmFormSmallTemplate
            editionMode: false
            defaultValue: ''

        @popover.show "Alarm creation", direction, alarmFormTemplate
        @popover.bindEvents startDate
