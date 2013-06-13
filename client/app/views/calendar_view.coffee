View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmsListView = require '../views/alarmsList_view'

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
            viewDisplay: @viewDisplay
            eventRender: @eventRender
            eventDragStop: @eventDragStop
            # Manage persistance when an edit action is performed
            eventDrop: @eventDrop
            # To manage the selection
            select: @select
            eventClick: @eventClick

    viewDisplay: (view) =>
        if @popoverTarget
            @popoverTarget.field.popover('destroy')
            @popoverTarget = null

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

    eventDrop: (event, dayDelta, minuteDelta, allDay, revertFunc) =>

        alarm =  @model.get event.id
        alarm.getDateObject().advance
            days: dayDelta
            minutes: minuteDelta

        data = trigg: alarm.getFormattedDate Alarm.dateFormat
        alarm.save data,
            wait: true
            success: =>
                event.isSaving = false
                @cal.fullCalendar('renderEvent', event)
            error: ->
                event.isSaving = false
                @cal.fullCalendar('renderEvent', event)
                revertFunc()

    select: (startDate, endDate, allDay, jsEvent, view) =>
        if view.name is "month"
            @handleSelectionInView(startDate, endDate, allDay, jsEvent)
        else if view.name is "agendaWeek"
            @handleSelectionInView(startDate, endDate, allDay, jsEvent)
        else if view.name is "agendaDay"
            @handleSelectionInView(startDate, endDate, allDay, jsEvent, true)

    handleSelectionInView: (startDate, endDate, allDay, jsEvent, isDayView) ->

        target = $(jsEvent.target)

        unless isDayView? and isDayView
            selectedWeekDay = Date.create(startDate).format('{weekday}')
            if selectedWeekDay in ['friday', 'saturday', 'sunday']
                direction = 'left'
            else
                direction = 'right'
        else
            selectedHour = Date.create(startDate).format('{HH}')
            if selectedHour >= 4
                direction = 'top'
            else
                direction = 'bottom'

        # if direction has changed, we rebuild the popover
        if @popoverTarget? and @popoverTarget.direction isnt direction
            @popoverTarget.field.popover('destroy')
            @popoverTarget = null

        # Handles the popover over the calendar grid
        if @popoverTarget? and @popoverTarget.action is "create"
            console.log direction
            if @popoverTarget.date.getTime() is startDate.getTime()
                @popoverTarget.field.popover('toggle')
            else
                @popoverTarget.field.popover('show')

            @popoverTarget.date = startDate
        else
            if @popoverTarget?
                @popoverTarget.field.popover('destroy')
                @popoverTarget = null

            @popoverTarget =
                field: $(target)
                date: startDate
                action: 'create'
                direction: direction

            @popoverTarget.field.popover(
                title: '<span>Alarm creation</span> <button type="button" class="close">&times;</button>'
                html: true
                placement: direction
                content: alarmFormSmallTemplate
                            editionMode: false
                            defaultValue: ''
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
                success: () =>
                    console.log "creation: success"
                    @popoverTarget.field.popover('destroy')
                    @popoverTarget = null
                error: () =>
                    console.log "creation: error"
                    @popoverTarget.field.popover('destroy')
                    @popoverTarget = null

        $('.popover input').keyup (event) ->
            button = $('.popover button.add-alarm')
            if $(@).val() is ''
                button.addClass 'disabled'
            else
                button.removeClass 'disabled'

    eventClick: (event, jsEvent, view) =>
        target = $(jsEvent.currentTarget)

        unless view.name is 'agendaDay'
            selectedWeekDay = Date.create(event.start).format('{weekday}')
            if selectedWeekDay in ['friday', 'saturday', 'sunday']
                direction = 'left'
            else
                direction = 'right'
        else
            selectedHour = Date.create(event.start).format('{HH}')
            if selectedHour >= 4
                direction = 'top'
            else
                direction = 'bottom'

        # Handles the popover over the calendar grid
        if not(@popoverTarget? and @popoverTarget.action is 'edit' and @popoverTarget.date.getTime() is event.start.getTime())

            @popoverTarget?.field.popover('destroy')

            @popoverTarget =
                field: $(target)
                date: event.start
                action: 'edit'

            @popoverTarget.field.popover(
                title: '<span>Alarm edition <i class="alarm-remove icon-trash" /></span> <button type="button" class="close">&times;</button>'
                html: true
                placement: direction
                content: alarmFormSmallTemplate
                            editionMode: true
                            defaultValue: event.title
            )
            .popover('show')

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

        $('.popover button.add-alarm').click =>
            alarm =  @model.get event.id

            data = description: $('.popover input').val()
            event.isSaving = true
            @cal.fullCalendar('renderEvent', event)
            alarm.save data,
                wait: true
                success: =>
                    event.isSaving = false
                    # TODO: update from backbone collection 'update' event
                    event.title = data.description
                    @cal.fullCalendar('renderEvent', event)
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

    onAdd: (alarm, alarms) ->

        index = alarm.getFormattedDate "{MM}-{dd}-{yyyy}"
        time = alarm.getFormattedDate "{hh}:{mm}"
        content = "#{time} #{alarm.get("description")}"

        endAlarm = alarm.getDateObject().clone()
        endAlarm.advance {minutes: 60}

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
        @model.forEach (item) =>
            @onAdd item, @model