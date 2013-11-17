app = require 'application'
BaseView = require '../lib/base_view'
AlarmPopOver = require './calendar_popover_alarm'
EventPopOver = require './calendar_popover_event'
helpers = require 'helpers'
timezones = require('helpers/timezone').timezones

Alarm = require 'models/alarm'
Event = require 'models/event'
# formSmallTemplate = {}
# formSmallTemplate.alarm = require('./templates/alarm_form_small')
# formSmallTemplate.event = require('./templates/event_form_small')


module.exports = class CalendarView extends BaseView

    id: 'viewContainer'
    template: require('./templates/calendarview')

    initialize: (options) ->
        @alarmCollection = @model.alarms
        @listenTo @alarmCollection, 'add'  , @refresh
        @listenTo @alarmCollection, 'reset', @refresh
        @listenTo @alarmCollection, 'remove', @onRemove
        @listenTo @alarmCollection, 'change', @refreshOne

        @eventCollection = @model.events
        @listenTo @eventCollection, 'add'  , @refresh
        @listenTo @eventCollection, 'reset', @refresh
        @listenTo @eventCollection, 'remove', @onRemove
        @listenTo @eventCollection, 'change', @refreshOne
        @model = null

    afterRender: ->
        locale = Date.getLocale(app.locale) # thanks sugarjs
        @cal = @$('#alarms')
        @cal.fullCalendar
            header:
                left: 'prev,next today'
                center: 'title'
                right: 'month,agendaWeek'
            editable: true
            firstDay: 1 # first day of the week is monday
            weekMode: 'liquid'
            height: @handleWindowResize('initial') # initial ratio
            defaultView: @options.view
            viewDisplay: @onChangeView # beware, deprected in next FC

            #i18n by SugarJs
            monthNames: locale.full_month.split('|').slice(1,13)
            monthNamesShort: locale.full_month.split('|').slice(13, 26)
            dayNames: locale.weekdays.slice(0, 7)
            dayNamesShort: locale.weekdays.slice(0, 7)
            buttonText:
                today: locale.day.split('|')[1]
                month: locale.units[6]
                week:  locale.units[5]
                day:   locale.units[4]

            timeFormat:
                '' : '' # do not display times on event
                'agendaWeek': ''
            axisFormat: "H:mm"
            allDaySlot: false
            selectable: true
            selectHelper: false
            unselectAuto: false
            eventRender: @onEventRender
            select: @onSelect
            eventDragStop: @onEventDragStop
            eventDrop: @onEventDrop
            eventClick: @onEventClick
            eventResizeStop: @onEventResizeStop
            eventResize: @onEventResize
            handleWindowResize: false

        @cal.fullCalendar 'addEventSource', @eventCollection.asFCEventSource
        @cal.fullCalendar 'addEventSource', @alarmCollection.asFCEventSource
        $(window).resize _.debounce @handleWindowResize, 10


    handleWindowResize: (initial) => # BLACK MAGICK AT WORK
        targetHeight = $(window).height() - 2 * $('#menu').outerHeight(true) - 60
        width = @cal.width() + 40
        @cal.height targetHeight + 20
        unless initial is 'initial'
            console.log "HEY"
            @cal.fullCalendar 'option', 'height', targetHeight
            # @cal.fullCalendar 'render'
        return targetHeight

    refresh: (collection) ->
        @cal.fullCalendar 'refetchEvents'

    onRemove: (model) ->
        @cal.fullCalendar 'removeEvents', model.cid

    refreshOne: (model) =>
        return @refresh() if model.getRRuleObject() #@TODO: may be smarter

        data = model.toFullCalendarEvent()
        [fcEvent] = @cal.fullCalendar 'clientEvents', data.id
        _.extend fcEvent, data
        console.log fcEvent
        @cal.fullCalendar 'updateEvent', fcEvent

    showPopover: (options) ->
        klass = if options.model instanceof Event then EventPopOver
        else AlarmPopOver
        options.container = @cal
        @popover.close() if @popover
        @popover = new(klass) options

    onChangeView: (view) =>
        switch view.name
            when 'month' then app.router.navigate 'calendar'
            when 'agendaWeek' then app.router.navigate 'calendarweek'

    onSelect: (startDate, endDate, allDay, jsEvent, view) =>
        @showPopover
            target: $(jsEvent.target)
            model: new Event
                start: startDate
                end: endDate
                place: ''
                description: ''

    onEventRender: (event, element) ->
        if event.isSaving? and event.isSaving
            spinTarget = $(element).find('.fc-event-time')
            spinTarget.addClass 'spinning'
            spinTarget.html "&nbsp;"
            spinTarget.spin "tiny"

        return element

    onEventDragStop: (event, jsEvent, ui, view) ->
        event.isSaving = true

    onEventDrop: (event, dayDelta, minuteDelta, allDay,
                  revertFunc, jsEvent, ui, view) =>

        # Update new dates of event
        if event.type is 'alarm'
            alarm = @alarmCollection.get event.id

            if alarm.get('timezoneHour')?
                # Hour should correspond to alarm timezone
                startRaw = alarm.get('timezoneHour')
                alarm.getDateObject().setHours(startRaw.substring(0, 2))
                alarm.getDateObject().setMinutes(startRaw.substring(3, 5))

            alarm.getDateObject().advance
                days: dayDelta
                minutes: minuteDelta

            data = trigg: alarm.getFormattedDate Alarm.dateFormat
            storeEvent alarm, data
        else
            evt = @eventCollection.get event.id
            evt.getStartDateObject().advance
                days: dayDelta
                minutes: minuteDelta

            evt.getEndDateObject().advance
                days: dayDelta
                minutes: minuteDelta
            data =
                start: evt.getFormattedStartDate Event.dateFormat
                end: evt.getFormattedEndDate Event.dateFormat
            storeEvent evt, data

    onEventResizeStop: (fcEvent, jsEvent, ui, view) ->
        fcEvent.isSaving = true

    onEventResize: (fcEvent, dayDelta, minuteDelta, revertFunc,
                    jsEvent, ui, view) =>

        # alarms can't be resized
        if fcEvent.type is "alarm"
            fcEvent.isSaving = false
            @cal.fullCalendar 'renderEvent', fcEvent
            revertFunc()
            return

        model = @eventCollection.get fcEvent.id

        model.getEndDateObject().advance
            days: dayDelta
            minutes: minuteDelta

        data =
            end: model.getFormattedEndDate Event.dateFormat
            diff: fcEvent.diff + dayDelta

        fcEvent.diff = fcEvent.diff
        fcEvent.end = fcEvent.end
        model.save data,
            wait: true
            error: =>
                revertFunc()
            complete: =>
                event.isSaving = false
                @cal.fullCalendar 'renderEvent', event


    onEventClick: (fcEvent, jsEvent, view) =>

        model = if fcEvent.type is 'alarm' then @alarmCollection.get fcEvent.id
        else if fcEvent.type is 'event' then @eventCollection.get fcEvent.id
        else throw new Error('wrong typed event in fc')

        @showPopover
            model: model,
            target: $(jsEvent.currentTarget),

