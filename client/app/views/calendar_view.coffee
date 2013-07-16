View = require '../lib/view'
AlarmFormView = require './alarmform_view'
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
        @popoverTarget?.field.popover 'destroy'
        @popoverTarget = null
        if view.name is "month"
            @handleSelectionInView startDate, endDate, allDay, jsEvent
        else if view.name is "agendaWeek"
            @handleSelectionInView startDate, endDate, allDay, jsEvent
        else if view.name is "agendaDay"
            @handleSelectionInView startDate, endDate, allDay, jsEvent, true

    deletePopOver: (view) =>
        if @popoverTarget
            @popoverTarget.field.popover('destroy')
            @popoverTarget = null

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
        console.log jsEvent
        console.log jsEvent.start
        console.log "blah"


        direction = helpers.getPopoverDirection view.name is 'agendaDay', event
        eventStartTime = event.start.getTime()

        unless @popoverTarget? and
        @popoverTarget.action is 'edit' and
        @popoverTarget.date.getTime() is eventStartTime

            @popoverTarget.field.popover 'destroy'
            @popoverTarget =
                field: $(target)
                date: event.start
                action: 'edit'

            formTemplate = alarmFormSmallTemplate
                editionMode: true
                defaultValue: event.title

            @popoverTarget.field.popover(
                title: '<span>Alarm edition <i class="alarm-remove icon-trash" /></span> <button type="button" class="close">&times;</button>'
                html: true
                placement: direction
                content: formTemplate
            ).popover('show')

        $('.popover .alarm-remove').click =>
            alarm =  @model.get event.id

            event.isSaving = true
            @cal.fullCalendar('renderEvent', event)
            alarm.destroy
                success: =>
                    event.isSaving = false
                    # TODO: update from backbone collection 'remove' event
                    @cal.fullCalendar('removeEvents', event.id)
                error: ->
                    event.isSaving = false
                    @cal.fullCalendar('renderEvent', event)
        $('.popover button.add-alarm').removeClass 'disabled'

        $('.popover input').keyup (event) ->
            button = $('.popover button.add-alarm')
            if $(@).val() is ''
                button.addClass 'disabled'
            else
                button.removeClass 'disabled'

        $('.popover button.close').click =>
            @popoverTarget.field.popover('destroy')
            @popoverTarget = null

    handleSelectionInView: (startDate, endDate, allDay, jsEvent, isDayView) ->
        target = $(jsEvent.target)
        direction = helpers.getPopoverDirection isDayView, startDate
        console.log direction


        # Handles the popover over the calendar grid
        if @popoverTarget? and @popoverTarget.action is "create"
            if @popoverTarget.date.getTime() is startDate.getTime()
                @popoverTarget.field.popover 'toggle'
            else
                @popoverTarget.field.popover 'show'

            @popoverTarget.date = startDate
        else
            @popoverTarget?.field.popover 'destroy'

            @popoverTarget =
                field: $(target)
                date: startDate
                action: 'create'

            alarmFormTemplate =  alarmFormSmallTemplate
                editionMode: false
                defaultValue: ''

            @popoverTarget.field.popover(
                title: '<span>Alarm creation</span> <button type="button" class="close">&times;</button>'
                html: true
                placement: direction
                content: alarmFormTemplate
            ).popover('show')

        $('.popover button.close').click =>
            @popoverTarget.field.popover('destroy')
            @popoverTarget = null

        $('.popover button.add-alarm').click (event) =>

            dueDate = Date.create(startDate)
            if dueDate.format('{HH}:{mm}') is '00:00'
                dueDate.advance {hours: 8}

            # smart detection: set the time if the user input has a time
            value = $('.popover input').val()
            smartDetection = value.match(/([0-9]?[0-9]:[0-9]{2})/)

            if smartDetection? and smartDetection[1]?
                specifiedTime = smartDetection[1]
                specifiedTime = specifiedTime.split /:/
                dueDate.set
                    hours: specifiedTime[0]
                    minutes: specifiedTime[1]

                value = value.replace(/(( )?((at|à) )?[0-9]?[0-9]:[0-9]{2})/, '')
                value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') # trim

            data =
                description: value
                action: 'DISPLAY'
                trigg: dueDate.format Alarm.dateFormat

            @model.create data,
                wait: true
                success: () ->
                    console.log "creation: success"
                    $(target).popover('destroy')
                error: () ->
                    console.log "creation: error"
                    $(target).popover('destroy')

        $('.popover input').keyup (event) ->
            button = $('.popover button.add-alarm')
            if $(@).val() is ''
                button.addClass 'disabled'
            else
                button.removeClass 'disabled'


