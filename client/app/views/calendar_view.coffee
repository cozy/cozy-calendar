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
                weekMode: 'liquid'
                aspectRatio: 2.031
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
                select: (startDate, endDate, allDay, jsEvent, view) =>

                    if view.name is "month"
                        @handleSelectionInMonthView(startDate, endDate, \
                                                    allDay, jsEvent)



    handleSelectionInMonthView: (startDate, endDate, allDay, jsEvent) ->

        target = $(jsEvent.target)

        selectedWeekDay = Date.create(startDate).format('{weekday}')
        if selectedWeekDay in ['saturday', 'sunday']
            direction = 'left'
        else
            direction = 'right'

        # Removes the popover if it already exists
        $(target).popover('destroy') if $('.popover').length > 0
        console.debug target
        $(target).popover(
            title: '<span>Alarm creation</span> <button type="button" class="close">&times;</button>'
            html: true
            placement: direction
            content: require('./templates/alarm_form_small'))
        .popover('show')

        $('.popover button.close').click =>
            $(target).popover('destroy')

        $('.popover button.add-alarm').click (event) =>

            dueDate = Date.create(startDate)
            if dueDate.format('{HH}:{mm}') is '00:00'
                dueDate.advance {hours: 8}

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