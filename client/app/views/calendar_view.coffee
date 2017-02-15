app = require 'application'

BaseView = require 'lib/base_view'
EventSharingButtonView = require './pending_event_sharings_button'
Header = require './calendar_header'
format = require '../format'

helpers = require 'helpers'


module.exports = class CalendarView extends BaseView

    id: 'view-container'
    template: require './templates/calendarview'


    initialize: (@options) ->
        @eventCollection = @model.events

        @listenTo @eventCollection, 'add', @refreshOne
        @listenTo @eventCollection, 'reset', @refresh
        @listenTo @eventCollection, 'remove', @onRemove
        @listenTo @eventCollection, 'change', @refreshOne

        @calendarsCollection = app.calendars
        @listenTo @calendarsCollection, 'change', @onCalendarCollectionChange

        @eventSharingButtonView = new EventSharingButtonView
            collection: @model.pendingEventSharingsCollection
            document: @options.document

        @model = null


    render: ->
        super()
        @eventSharingButtonView.snap(@).render()


    afterRender: ->
        locale = moment.localeData()

        @cal = @$ '#alarms'
        @view = @options.view
        # set default date
        currDate = moment()
        currDate.year(@options.year)   if @options.year?
        currDate.month(@options.month) if @options.month?
        currDate.date(@options.date)   if @options.date? and @view isnt 'month'

        @cal.fullCalendar
            lang: window.app.locale
            header: false
            firstDay: 1 # first day of the week is monday
            height: "auto"
            defaultView: @view
            defaultDate: currDate
            viewRender: @onChangeView
            #i18n with momentjs.
            monthNames: locale._months
            monthNamesShort: locale._monthsShort
            dayNames: locale._weekdays
            dayNamesShort: locale._weekdaysShort
            buttonText:
                today: t('today')
                month: t('month')
                day:   t('day')

            # Display time in the cozy's user timezone.
            # time given by Fullcalendar are ambiguous moments,
            # with cozy's user timezone values.
            # Cf http://fullcalendar.io/docs/timezone/timezone/
            timezone: window.app.timezone
            timeFormat: '' # Setted in scheduleitem title.
            columnFormat:
                'month': 'dddd'

            axisFormat: 'H:mm'
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
            weekNumbers: true
            nextDayThreshold: "04:00:00"

        source = @eventCollection.getFCEventSource @calendarsCollection
        @cal.fullCalendar 'addEventSource', source

        @calHeader = new Header
            cal: @cal
            view: @view

        # Before displaying the calendar for the previous month, we make sure
        # that events are loaded.
        @calHeader.on 'prev', =>
            @clearViewComponents =>
                monthToLoad = @cal.fullCalendar('getDate').subtract(1, 'months')
                window.app.events.loadMonth monthToLoad, =>
                    @cal.fullCalendar 'prev'
                    # This action is due to a bug of fullcalendar which
                    # removes events from the last day of the week from
                    # the view.
                    @refreshEventsOfLastDisplayedDay() if @isWeekViewActive()


        # Before displaying the calendar for the next month, we make sure that
        # events are loaded.
        @calHeader.on 'next', =>
            @clearViewComponents =>
                monthToLoad = @cal.fullCalendar('getDate').add(1, 'months')
                window.app.events.loadMonth monthToLoad, =>
                    @cal.fullCalendar 'next'
                    # This action is due to a bug of fullcalendar which
                    # removes events from the last day of the week from
                    # the view.
                    @refreshEventsOfLastDisplayedDay() if @isWeekViewActive()

        @calHeader.on 'today', =>
            @clearViewComponents =>
                @cal.fullCalendar 'today'
                # This action is due to a bug of fullcalendar which
                # removes events from the last day of the week from
                # the view.
                @refreshEventsOfLastDisplayedDay() if @isWeekViewActive()

        @calHeader.on 'month', =>
            hash = @getMonthUrlHash()
            app.router.navigate hash, true

        @calHeader.on 'week', =>
            hash = @getWeekUrlHash()
            app.router.navigate hash, true

        @calHeader.on 'list', =>
            @clearViewComponents ->
                window.app.events.sort()
                app.router.navigate 'list', trigger:true

        @$('#alarms').prepend @calHeader.render().$el

        @handleWindowResize()
        debounced = _.debounce @handleWindowResize, 10
        $(window).resize (ev) -> debounced() if ev.target is window


    isWeekViewActive: ->
        return @view is 'agendaWeek'


    remove: ->
        @popover?.close()
        super


    handleWindowResize: (initial) =>
        if $(window).width() > 1000
            targetHeight = $(window).height() - 85

        else if $(window).width() > 600
            targetHeight = $(window).height() - 100

        else
            targetHeight = $(window).height() - 50

        @cal.fullCalendar 'option', 'height', targetHeight


    refresh: () ->
        @cal.fullCalendar 'refetchEvents'


    onCalendarCollectionChange: () ->
        @refresh()

    onRemove: (model) ->
        @cal.fullCalendar 'removeEvents', model.cid


    refreshOne: (model) =>
        return null unless model?

        # Removing / adding prevent display glitches that update don't handle
        # properly like full day or reccuring events.
        @removeEventFromView model
        @addEventToView model


    refreshEventsOfLastDisplayedDay: =>
        view = @cal.fullCalendar 'getView'
        beginOfLastDay = view.intervalEnd.clone().subtract 1, 'days'
        endOfLastDay = view.intervalEnd

        for model in @eventCollection.models
            eventStart = model.getStartDateObject()
            isFromLastDay = eventStart.isAfter(beginOfLastDay) and \
                eventStart.isBefore(endOfLastDay)

            @refreshOne model if isFromLastDay


    getFcEvent: (model) =>
        [fcEvent] = @cal.fullCalendar 'clientEvents', model.cid
        return fcEvent

    getPopoverContainer: =>
        if @view is 'month'
            content = @$ '.fc-day-grid-container'
        else if @view is 'agendaWeek'
            content = @$ '.fc-widget-content'
        else
            content = @$ '.main-container'
        return content

    addEventToView: (model) =>
        if model.isRecurrent()
            @_addReccuringEventToView model
        else
            @addFcEventToView model.toPunctualFullCalendarEvent()

    addFcEventToView: (fcEvent) =>
        @cal.fullCalendar 'renderEvent', fcEvent

    _addReccuringEventToView: (model) =>
        fcView = @cal.fullCalendar 'getView'
        start = fcView.intervalStart
        end = fcView.intervalEnd.add 7, 'day'
        events = model.getRecurrentFCEventBetween start, end
        @addFcEventToView event for event in events

    removeEventFromView: (model) =>
        fcEvent = @getFcEvent model
        @cal.fullCalendar 'removeEvents', model.cid if fcEvent?

    onChangeView: (view) =>
        @calHeader?.render()
        if @view isnt view.name
            @handleWindowResize()

        @view = view.name

        hash = view.intervalStart.format format.MONTH_URL_HASH_FORMAT
        if @view is 'month'
            hash = @getMonthUrlHash view
        else if @view is 'agendaWeek'
            hash = @getWeekUrlHash view
        app.router.navigate hash


    clearViewComponents: (callback)->
        if @popover
            @popover.close(callback)
        else
            callback() if callback and typeof callback is 'function'


    getUrlHash: ->
        return 'calendar'

    getWeekUrlHash: (view) ->
        now = moment()
        view ?= @cal.fullCalendar 'getView'

        if view.intervalStart.month() is now.month()
            beginningOfTodayWeek = now.startOf('isoWeek')
            return beginningOfTodayWeek.format format.WEEK_URL_HASH_FORMAT
        else
            begginingOfCurrentView = view.intervalStart.startOf('isoWeek')
            return begginingOfCurrentView.format format.WEEK_URL_HASH_FORMAT

    getMonthUrlHash: (view) ->
        view ?= @cal.fullCalendar 'getView'
        if view.name is 'agendaWeek'
            monthOfEndOfTheWeek = view.intervalEnd.startOf('month')
            return monthOfEndOfTheWeek.format format.MONTH_URL_HASH_FORMAT
        else
            return view.intervalStart.format format.MONTH_URL_HASH_FORMAT


    onSelect: (startDate, endDate, jsEvent, view) =>

        # In month view, default to 10:00 - 11:00 instead of fullday event.
        if @view is 'month'
            startDate.time('10:00:00.000')
            endDate.subtract(1, 'days').time('11:00:00.000')
        content = @getPopoverContainer()

        @trigger 'event:dialog', {
            type: 'event'
            start: helpers.ambiguousToTimezoned startDate
            end: helpers.ambiguousToTimezoned endDate
            target: $ jsEvent.target
            openerEvent: jsEvent.originalEvent
            container: @cal
            content: content
        }

    onEventRender: (event, $element) ->
        # TODO: use the new spinner, instead of this.
        if event.isSaving? and event.isSaving
            spinTarget = $element.find '.fc-event-time'
            spinTarget.addClass 'spinning'
            spinTarget.html "&nbsp;"
            spinTarget.spin "tiny"

        # Title and time are joined in the .fc-title for some reason.
        # Let's split them to put them in the right element.
        $displayedElement = $element.find '.fc-title'
        titleAndTime = $displayedElement.html()
        if event.allDay
            time = ''
            title = titleAndTime
        else
            [time, title...] = titleAndTime.split ' '
            title = title.join ' '
        # Append the right values to the right elements.
        $element.find('.fc-time').html time
        $element.find('.fc-title').html title

        $element.attr 'title', event.title

        return $element


    onEventDragStop: (event, jsEvent, ui, view) ->
        event.isSaving = true


    onEventDrop: (fcEvent, delta, revertFunc, jsEvent, ui, view) =>
        evt = @eventCollection.get fcEvent.id
        evt.addToStart(delta)
        evt.addToEnd(delta)

        evt.save {},
            wait: true
            success: ->
                fcEvent.isSaving = false
            error: ->
                fcEvent.isSaving = false
                revertFunc()


    onEventResizeStop: (fcEvent, jsEvent, ui, view) ->
        fcEvent.isSaving = true


    onEventResize: (fcEvent, delta, revertFunc, jsEvent, ui, view) =>

        model = @eventCollection.get fcEvent.id
        model.addToEnd delta

        model.save {},
            wait: true
            success: ->
                fcEvent.isSaving = false

            error: ->
                fcEvent.isSaving = false
                revertFunc()


    onEventClick: (fcEvent, jsEvent, view) =>
        return true if $(jsEvent.target).hasClass 'ui-resizable-handle'

        model = if fcEvent.type is 'event' then @eventCollection.get fcEvent.id
        else throw new Error('wrong typed event in fc')
        content = @getPopoverContainer()

        @trigger 'event:dialog', {
            type: model.fcEventType
            model: model
            target: $ jsEvent.currentTarget
            openerEvent: jsEvent.originalEvent
            container: @cal
            content: content
        }
