app = require 'application'
BaseView = require '../lib/base_view'
Popover = require './calendar_popover'
EventPopover = require './calendar_popover_event'
AlarmPopover = require './calendar_popover_alarm'
Header = require './calendar_header'
helpers = require 'helpers'
timezones = require('helpers/timezone').timezones

Alarm = require 'models/alarm'
Event = require 'models/event'


module.exports = class CalendarView extends BaseView

    id: 'view-container'
    template: require('./templates/calendarview')

    initialize: (@options) ->
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

        @tagsCollection = app.tags
        @listenTo @tagsCollection, 'change', @refresh

    afterRender: ->
        locale = moment.localeData()

        @cal = @$('#alarms')
        @view = @options.view
        @cal.fullCalendar
            lang: window.locale
            header: false
            editable: true
            firstDay: 1 # first day of the week is monday
            # weekMode: 'liquid' deprecated --> http://fullcalendar.io/docs/display/weekMode/
            # height: @handleWindowResize('initial') # initial ratio
            defaultView: @view
            year: @options.year
            month: @options.month
            date: @options.date
            # viewDisplay: @onChangeView # beware, deprected in next FC --> # viewRender 
            viewRender: @onChangeView


            #i18n with momentjs.
            monthNames: locale._months
            monthNamesShort: locale._monthsShort
            dayNames: locale._weekdays
            dayNamesShort: locale._weekdaysShort
            buttonText:
                today: t('today')
                month: t('month')
                week:  t('week')
                day:   t('day')

            timezone: window.app.timezone
            # timezone: "UTC"

            # timezone: "UTC"  --> selectEvent : view : browser locale time ; event : UTC. Ex with Europe/Paris TZ, 2014/09/02, 5:00 --> 2014-09-02T03:30:00.000Z || America/NewYork --> 2014-09-02T09:00:00.000Z
            # timezone: false <-- idem. || 
            # timezone: window.app.timezone
            # timezone: "local"

            # "In other parts of the API, moments will be represented in UTC." http://arshaw.com/fullcalendar/docs/timezone/timezone/ 
            #ignoreTimezone: true # 20140904 TODO : what's behaviour of this indead ? http://arshaw.com/fullcalendar/docs1/event_data/ignoreTimezone/
            
            timeFormat: ''
                # 'month': 'H:mm'
                # 'week': 'H:mm'
                # 'default': 'H:mm'
                # #'' : '' # do not display times on event
                # 'agendaWeek': 'H:mm'
                # # 'agendaMonth': 'h:mm'
            columnFormat:
                'week': 'ddd D'
                'month': 'dddd'

            axisFormat: "H:mm"
            allDaySlot: true
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

        source = @eventCollection.getFCEventSource @tagsCollection
        @cal.fullCalendar 'addEventSource', source

        source = @alarmCollection.getFCEventSource @tagsCollection
        @cal.fullCalendar 'addEventSource', source

        @calHeader = new Header cal: @cal

        @calHeader.on 'next', => @cal.fullCalendar 'next'
        @calHeader.on 'prev', => @cal.fullCalendar 'prev'
        @calHeader.on 'today', => @cal.fullCalendar 'today'
        @calHeader.on 'week', => @cal.fullCalendar 'changeView', 'agendaWeek'
        @calHeader.on 'month', => @cal.fullCalendar 'changeView', 'month'
        @calHeader.on 'list', => app.router.navigate 'list', trigger:true
        @$('#alarms').prepend @calHeader.render().$el

        @handleWindowResize()
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
        @cal.height @$('.fc-header').height() + @$('.fc-view-container').height()
        # @cal.height @$('.fc-header').height() + @$('.fc-content').height()


    refresh: (collection) ->
        console.log "refresh"
        @cal.fullCalendar 'refetchEvents'

    onRemove: (model) ->
        @cal.fullCalendar 'removeEvents', model.cid

    refreshOne: (model) =>
        # Skip if Popover is open, to avoid autoclosing.
        console.log "refreshOne"
        if @popover
            return 

        # return @refresh() if model.getRRuleObject() #@TODO: may be smarter
        return @refresh() if model.isRecurrent()

        data = model.toPunctualFullCalendarEvent()
        [fcEvent] = @cal.fullCalendar 'clientEvents', data.id
        _.extend fcEvent, data
        @cal.fullCalendar 'updateEvent', fcEvent

    showPopover: (options) ->
        options.container = @cal
        options.parentView = @

        if @popover
            @popover.close()

            # click on same case
            if @popover.options?
                if @popover.options.model? and @popover.options.model is options.model or(
                        @popover.options.start?.isSame(options.start) and
                        @popover.options.end?.isSame(options.end) and
                        @popover.options.type is options.type)

                    @cal.fullCalendar 'unselect'
                    @popover = null
                    return

        @popover = if options.type == 'event' then new EventPopover options else new AlarmPopover options
        @popover.render()

    onChangeView: (view) =>
        @calHeader?.render()
        if @view isnt view.name
            @handleWindowResize()

        @view = view.name

        start = view.start
        hash = if @view is 'month'
            start.format('[month]/YYYY/M')

        else
            start.format('[week]/YYYY/M/D')

        app.router.navigate hash

    getUrlHash: =>
        switch @cal.fullCalendar('getView').name
            when 'month' then 'calendar'
            when 'agendaWeek' then 'calendarweek'

    onSelect: (startDate, endDate, jsEvent, view) =>
         # In month view, default to 10:00 - 18:00 instead of fullday event.
        if @view is 'month'
            start = Event.ambiguousToTimezoned("#{startDate.format()}T10:00:00.000")
            end = Event.ambiguousToTimezoned("#{endDate.add('day', -1).format()}T18:00:00.000")
        else
            start = Event.ambiguousToTimezoned(startDate)
            end = Event.ambiguousToTimezoned(endDate)

        @showPopover
            type: 'event'
            start: start
            end: end
            target: $(jsEvent.target)

    onPopoverClose: ->
        console.log 'yeeeeeee'
        @cal.fullCalendar 'unselect'
        @popover = null

        # Force a refresh, as refresh was deactivated while popover was open.
        @refresh()

    onEventRender: (event, element) ->
        if event.isSaving? and event.isSaving
            spinTarget = $(element).find('.fc-event-time')
            spinTarget.addClass 'spinning'
            spinTarget.html "&nbsp;"
            spinTarget.spin "tiny"

        $(element).attr 'title', event.title
        if event.type is 'alarm'
            icon = '<i class="icon-bell icon-white"></i>'
            element.find('.fc-title').prepend icon

        return element

    onEventDragStop: (event, jsEvent, ui, view) ->
        event.isSaving = true

    onEventDrop: (fcEvent, delta, revertFunc, jsEvent, ui, view) =>
        # Update new dates of event
        ## 20140909 TODO.
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

            evt.addToStart(delta)
            evt.addToEnd(delta)

            evt.save {},
                wait: true
                success: =>
                    fcEvent.isSaving = false
                    #@cal.fullCalendar 'renderEvent', fcEvent
                error: =>
                    fcEvent.isSaving = false
                    revertFunc()

    onEventResizeStop: (fcEvent, jsEvent, ui, view) ->
        fcEvent.isSaving = true

    onEventResize: (fcEvent, delta, revertFunc, jsEvent, ui, view) =>
        # alarms can't be resized
        if fcEvent.type is "alarm"
            fcEvent.isSaving = false
            @cal.fullCalendar 'renderEvent', fcEvent
            revertFunc()
            return

        model = @eventCollection.get fcEvent.id

        model.addToEnd(delta)

        model.save {},
            wait: true
            success: =>
                fcEvent.isSaving = false
                # @cal.fullCalendar 'renderEvent', fcEvent

            error: =>
                fcEvent.isSaving = false
                revertFunc()


    onEventClick: (fcEvent, jsEvent, view) =>
        return true if $(jsEvent.target).hasClass 'ui-resizable-handle'

        model = if fcEvent.type is 'alarm' then @alarmCollection.get fcEvent.id
        else if fcEvent.type is 'event' then @eventCollection.get fcEvent.id
        else throw new Error('wrong typed event in fc')

        @showPopover
            type: model.fcEventType
            model: model
            target: $(jsEvent.currentTarget)
