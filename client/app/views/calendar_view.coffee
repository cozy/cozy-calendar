app = require 'application'
BaseView = require '../lib/base_view'
Popover = require './calendar_popover'
Header = require './calendar_header'
helpers = require 'helpers'
timezones = require('helpers/timezone').timezones

Alarm = require 'models/alarm'
Event = require 'models/event'


module.exports = class CalendarView extends BaseView

    id: 'view-container'
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
        @view = @options.view
        @cal.fullCalendar
            header: false
            editable: true
            firstDay: 1 # first day of the week is monday
            weekMode: 'liquid'
            height: @handleWindowResize('initial') # initial ratio
            defaultView: @view
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

            ignoreTimezone: true
            timeFormat:
                '' : '' # do not display times on event
                'agendaWeek': ''
            columnFormat:
                'week': 'ddd d'

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

        @calHeader = new Header cal: @cal

        @calHeader.on 'next', => @cal.fullCalendar 'next'
        @calHeader.on 'prev', => @cal.fullCalendar 'prev'
        @calHeader.on 'today', => @cal.fullCalendar 'today'
        @$('#alarms').prepend @calHeader.render().$el

        @handleWindowResize() #
        debounced = _.debounce @handleWindowResize, 10
        $(window).resize (ev) -> debounced() if ev.target is window

    remove: ->
        @popover?.close()
        super


    handleWindowResize: (initial) =>
        if $(window).width() > 1000
            targetHeight = $(window).height() - 90
            $("#menu").height targetHeight + 90
        else if $(window).width() > 600
            targetHeight = $(window).height() - 100
            $("#menu").height targetHeight + 100
        else
            targetHeight = $(window).height() - 50
            $("#menu").height 40

        @cal.fullCalendar 'option', 'height', targetHeight unless initial is 'initial'
        @cal.height @$('.fc-header').height() + @$('.fc-content').height()


    refresh: (collection) ->
        @cal.fullCalendar 'refetchEvents'

    onRemove: (model) ->
        @cal.fullCalendar 'removeEvents', model.cid

    refreshOne: (model) =>
        return @refresh() if model.getRRuleObject() #@TODO: may be smarter

        data = model.toFullCalendarEvent()
        [fcEvent] = @cal.fullCalendar 'clientEvents', data.id
        _.extend fcEvent, data
        @cal.fullCalendar 'updateEvent', fcEvent

    showPopover: (options) ->
        options.container = @cal
        options.parentView = this

        if @popover
            @popover.close()

            # click on same case
            if @popover.options.model? and @popover.options.model is options.model or(
                @popover.options.start?.is(options.start) and
                @popover.options.end?.is(options.end) and
                @popover.options.type is options.type)
                @cal.fullCalendar 'unselect'
                @popover = null
                return

        @popover = new Popover options
        @popover.render()

    onChangeView: (view) =>
        @calHeader?.render()
        if @view isnt view.name
            switch @view = view.name
                when 'month' then app.router.navigate 'calendar'
                when 'agendaWeek' then app.router.navigate 'calendarweek'
            @handleWindowResize()

    getUrlHash: =>
        switch @cal.fullCalendar('getView').name
            when 'month' then 'calendar'
            when 'agendaWeek' then 'calendarweek'

    onSelect: (startDate, endDate, allDay, jsEvent, view) =>
        @showPopover
            type: 'event'
            start: startDate
            end: endDate
            target: $(jsEvent.target)

    onPopoverClose: ->
        @cal.fullCalendar 'unselect'
        @popover = null

    onEventRender: (event, element) ->
        if event.isSaving? and event.isSaving
            spinTarget = $(element).find('.fc-event-time')
            spinTarget.addClass 'spinning'
            spinTarget.html "&nbsp;"
            spinTarget.spin "tiny"

        $(element).attr 'title', event.title

        return element

    onEventDragStop: (event, jsEvent, ui, view) ->
        event.isSaving = true

    onEventDrop: (fcEvent, dayDelta, minuteDelta, allDay,
                  revertFunc, jsEvent, ui, view) =>

        # Update new dates of event
        if fcEvent.type is 'alarm'
            alarm = @alarmCollection.get fcEvent.id

            # if alarm.get('timezoneHour')?
            #     # Hour should correspond to alarm timezone
            #     startRaw = alarm.get('timezoneHour')
            #     alarm.getDateObject().setHours(startRaw.substring(0, 2))
            #     alarm.getDateObject().setMinutes(startRaw.substring(3, 5))

            trigg = alarm.getDateObject().clone().advance
                days: dayDelta
                minutes: minuteDelta

            alarm.save
                trigg: trigg.format Alarm.dateFormat, 'en-en'
                timezoneHour: false
            ,
                wait: true
                success: =>
                    fcEvent.isSaving = false
                    @cal.fullCalendar 'renderEvent', fcEvent
                error: =>
                    fcEvent.isSaving = false
                    revertFunc()
        else
            evt = @eventCollection.get fcEvent.id
            start = evt.getStartDateObject().clone().advance
                days: dayDelta
                minutes: minuteDelta

            end = evt.getEndDateObject().clone().advance
                days: dayDelta
                minutes: minuteDelta

            evt.save
                start: start.format Event.dateFormat, 'en-en'
                end: end.format Event.dateFormat, 'en-en'
            ,
                wait: true
                success: =>
                    fcEvent.isSaving = false
                    @cal.fullCalendar 'renderEvent', fcEvent
                error: =>
                    fcEvent.isSaving = false
                    revertFunc()

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
        end = model.getEndDateObject().clone()
        end.advance
            days: dayDelta
            minutes: minuteDelta

        data =
            end: end.format Event.dateFormat, 'en-en'

        model.save data,
            wait: true
            success: =>
                fcEvent.isSaving = false
                @cal.fullCalendar 'renderEvent', fcEvent

            error: =>
                fcEvent.isSaving = false
                revertFunc()


    onEventClick: (fcEvent, jsEvent, view) =>
        return true if $(jsEvent.target).hasClass 'ui-resizable-handle'

        model = if fcEvent.type is 'alarm' then @alarmCollection.get fcEvent.id
        else if fcEvent.type is 'event' then @eventCollection.get fcEvent.id
        else throw new Error('wrong typed event in fc')

        @showPopover
            model: model,
            target: $(jsEvent.currentTarget)
