app = require 'application'
BaseView = require 'lib/base_view'
EventPopover = require './calendar_popover_event'
EventSharingButtonView = require './pending_event_sharings_button'
Header = require './calendar_header'
helpers = require 'helpers'
timezones = require('helpers/timezone').timezones

Event = require 'models/event'


module.exports = class CalendarView extends BaseView

    id: 'view-container'
    template: require './templates/calendarview'


    initialize: (@options) ->

        @eventCollection = @model.events

        @listenTo @eventCollection, 'add'  , @refresh
        @listenTo @eventCollection, 'reset', @refresh
        @listenTo @eventCollection, 'remove', @onRemove
        @listenTo @eventCollection, 'change', @refreshOne

        @calendarsCollection = app.calendars
        @listenTo @calendarsCollection, 'change', @onCalendarCollectionChange

        @eventSharingButtonView = new EventSharingButtonView
            collection: @model.pendingEventSharingsCollection

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

        @calHeader = new Header cal: @cal

        # Before displaying the calendar for the previous month, we make sure
        # that events are loaded.
        @calHeader.on 'prev', =>
            monthToLoad = @cal.fullCalendar('getDate').subtract('months', 1)
            window.app.events.loadMonth monthToLoad, =>
                @cal.fullCalendar 'prev'

        # Before displaying the calendar for the next month, we make sure that
        # events are loaded.
        @calHeader.on 'next', =>
            monthToLoad = @cal.fullCalendar('getDate').add('months', 1)
            window.app.events.loadMonth monthToLoad, =>
                @cal.fullCalendar 'next'

        @calHeader.on 'today', => @cal.fullCalendar 'today'
        @calHeader.on 'month', => @cal.fullCalendar 'changeView', 'month'
        @calHeader.on 'list', ->
            window.app.events.sort()
            app.router.navigate 'list', trigger:true
        @$('#alarms').prepend @calHeader.render().$el

        @handleWindowResize()
        debounced = _.debounce @handleWindowResize, 10
        $(window).resize (ev) -> debounced() if ev.target is window


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


    refresh: (collection) ->
        @cal.fullCalendar 'refetchEvents'


    onCalendarCollectionChange: (collection) ->
        @refresh collection

    onRemove: (model) ->
        @cal.fullCalendar 'removeEvents', model.cid


    refreshOne: (model) =>

        return null unless model?

        previousRRule = model.previous('rrule')
        modelWasRecurrent = previousRRule? and previousRRule isnt ''
        return @refresh() if model.isRecurrent() or modelWasRecurrent

        # fullCalendar('updateEvent') eats end of allDay events!(?),
        # perform a full refresh as a workaround.
        return @refresh() if model.isAllDay()

        data = model.toPunctualFullCalendarEvent()
        [fcEvent] = @cal.fullCalendar 'clientEvents', data.id
        # if updated event is not shown on screen, fcEvent doesn't exist
        if fcEvent?
            _.extend fcEvent, data
            @cal.fullCalendar 'updateEvent', fcEvent

        # Refresh to deal with calendar update.
        # If the new calendar is not visible the event should not be shown
        @refresh()


    showPopover: (options) ->
        options.container = @cal
        options.parentView = @

        if @popover
            @popover.close()

            # click on same case
            if @popover.options? and (@popover.options.model? and \
               @popover.options.model is options.model or \
               (@popover.options.start?.isSame(options.start) and \
               @popover.options.end?.isSame(options.end) and \
               @popover.options.type is options.type))

                @cal.fullCalendar 'unselect'
                @popover = null
                return

        @popover = new EventPopover options
        @popover.render()


    # Close the popover, if it's open.
    closePopover: ->
        @popover?.close()
        @onPopoverClose()


    onChangeView: (view) =>

        # Prevent a popover from staying on screen, if it's open.
        @closePopover()

        @calHeader?.render()
        if @view isnt view.name
            @handleWindowResize()

        @view = view.name

        hash = view.intervalStart.format '[month]/YYYY/M'

        app.router.navigate hash


    getUrlHash: =>
        return 'calendar'


    onSelect: (startDate, endDate, jsEvent, view) =>
        # In month view, default to 10:00 - 11:00 instead of fullday event.
        if @view is 'month'
            startDate.time('10:00:00.000')
            endDate.subtract(1, 'days').time('11:00:00.000')

        start = helpers.ambiguousToTimezoned startDate
        end = helpers.ambiguousToTimezoned endDate
        @showPopover
            type: 'event'
            start: start
            end: end
            target: $ jsEvent.target


    onPopoverClose: ->
        @cal.fullCalendar 'unselect'
        @popover = null


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

        @showPopover
            type: model.fcEventType
            model: model
            target: $(jsEvent.currentTarget)
