View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmPopOver = require './alarm_popover'
AlarmsListView = require '../views/alarms_list_view'
EventPopOver = require './event_popover'
helpers = require '../helpers'
timezones = require('helpers/timezone').timezones

Alarm = require '../models/alarm'
Event = require '../models/event'
formSmallTemplate = {}
formSmallTemplate.alarm = require('./templates/alarm_form_small')
formSmallTemplate.event = require('./templates/event_form_small')


module.exports = class CalendarView extends View

    el: '#viewContainer'

    initialize: (alarm, evt) ->
        @caldata = {}
        @model.alarm = alarm
        @model.event = evt
        @listenTo @model.alarm, 'add', @onAddAlarm
        @listenTo @model.alarm, 'reset', @onResetAlarm
        @listenTo @model.event, 'add', @onAddEvent
        @listenTo @model.event, 'reset', @onResetEvent

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
        @popover = {}
        @popover.alarm = new AlarmPopOver @cal
        @popover.event = new EventPopOver @cal

    onAddAlarm: (alarm, alarms) ->
        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"
        endAlarm = alarm.getDateObject().clone()
        endAlarm.advance minutes: 30

        event =
            id: alarm.cid
            title: alarm.get 'description'
            timezone: alarm.get 'timezone'
            start: alarm.getFormattedDate(Date.ISO8601_DATETIME)
            end: endAlarm.format(Date.ISO8601_DATETIME)
            allDay: false
            backgroundColor: '#5C5'
            borderColor: '#5C5'
            type: 'alarm' # non standard field

        @cal.fullCalendar 'addEventSource', [event]


    onResetAlarm: ->
        @model.alarm.forEach (item) => @onAddAlarm item, @model.alarm

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
            allDay: false
            diff: evt.get "diff"
            place: evt.get 'place' 
            backgroundColor: '#EB1'
            borderColor: '#EB1'
            type: 'event' # non standard field

        @cal.fullCalendar 'addEventSource', [event]

    onResetEvent: ->
        @model.event.forEach (item) => @onAddEvent item, @model.event

    onSelect: (startDate, endDate, allDay, jsEvent, view) =>
        @popover.alarm.clean()
        @popover.event.clean()
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

        # Store event in database and update it in calendar
        storeEvent = (model, data) =>
            model.save data,
                wait: true
                success: =>
                    event.isSaving = false
                    @cal.fullCalendar 'renderEvent', event
                error: =>
                    event.isSaving = false
                    @cal.fullCalendar 'renderEvent', event
                    revertFunc()

        # Update new dates of event
        if event.type is 'alarm'
            alarm = @model.alarm.get event.id
            alarm.getDateObject().advance
                days: dayDelta
                minutes: minuteDelta

            data = trigg: alarm.getFormattedDate Alarm.dateFormat
            storeEvent(alarm, data)
        else
            evt = @model.event.get event.id
            evt.getStartDateObject().advance
                days: dayDelta
                minutes: minuteDelta

            evt.getEndDateObject().advance
                days: dayDelta
                minutes: minuteDelta
            data = 
                start: evt.getFormattedStartDate Event.dateFormat
                end: evt.getFormattedEndDate Event.dateFormat
            storeEvent(evt, data)

    onEventClick: (event, jsEvent, view) =>
        target = $(jsEvent.currentTarget)
        eventStartTime = event.start.getTime()
        isDayView = view.name is 'agendaDay'
        direction = helpers.getPopoverDirection isDayView, event.start

        # Clean other popover if it exists
        @popover.event.clean()
        @popover.alarm.clean()

        unless @popover[event.type].isExist? and
        @popover[event.type].action is 'edit' and
        @popover[event.type].date?.getTime() is eventStartTime
            # Create new popover to edit alarm or event
            @popover[event.type].createNew
                field: $(target)
                date: event.start
                action: 'edit'
                model: @model[event.type]
                event: event
            # Initialize template and show popover
            if event.type is 'alarm'
                timezoneData = []
                for timezone in timezones
                    timezoneData.push value: timezone, text: timezone
                formTemplate = formSmallTemplate.alarm
                    editionMode: true
                    defaultValue: event.title
                    timezones: timezoneData
                    defaultTimezone: event.timezone

                @popover.alarm.show "Alarm edition", direction, formTemplate

            else
                diff = event.diff
                defaultValueEnd = event.end.format('{HH}:{mm}') + "+" + diff
                formTemplate = formSmallTemplate.event
                    editionMode: true
                    defaultValueStart: event.start.format('{HH}:{mm}')
                    defaultValueEnd: defaultValueEnd
                    defaultValuePlace: event.place
                    defaultValueDesc: event.title
                @popover.event.show "Event edition", direction, formTemplate

        @popover[event.type].bindEditEvents()

    # Display popover to create alarm or event if user selects several cases
    handleSelectionInView: (startDate, endDate, allDay, jsEvent, isDayView) ->
        target = $(jsEvent.target)
        direction = helpers.getPopoverDirection isDayView, startDate
        startHour = startDate.format('{HH}:{mm}').split(':')
        endHour = endDate.format('{HH}:{mm}').split(':')

        # Initialize templates and type of popover
        if helpers.isEvent(startHour, endHour)
            type = 'event'
            formTemplate = formSmallTemplate.event
                editionMode: false
                defaultValueStart: startDate.format('{HH}:{mm}')
                defaultValueEnd: endDate.format('{HH}:{mm}')
                defaultValuePlace: ''
                defaultValueDesc: ''
            title = "Event creation"
        else
            type = 'alarm'
            timezoneData = []
            for timezone in timezones
                    timezoneData.push value: timezone, text: timezone
            formTemplate = formSmallTemplate.alarm
                editionMode: false
                timezones: timezoneData
                defaultTimezone: 'Use specific timezone'
                defaultValue: ''
            title = "Alarm creation"

        # Create popover to create alarm or event
        @popover[type].createNew
            field: $(target)
            date: startDate
            action: 'create'
            model: @model[type]
            modelEvent: @model.event
        @popover[type].show title, direction , formTemplate
        @popover[type].bindEvents startDate
