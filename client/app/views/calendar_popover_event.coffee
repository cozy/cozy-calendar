PopoverView = require '../lib/popover_view'
EventModal  = require 'views/event_modal'
ComboBox    = require 'views/widgets/combobox'
Event       = require 'models/event'


tFormat                 = 'HH:mm'
dFormat                 = 'DD/MM/YYYY'
inputDateDTPickerFormat = 'dd/mm/yyyy'
allDayDateFieldFormat   = 'YYYY-MM-DD'

defTimePickerOpts       =
    template: false
    minuteStep: 5
    showMeridian: false

defDatePickerOps        =
    language: window.app.locale
    fontAwesome: true
    autoclose: true
    pickerPosition: 'bottom-right'
    keyboardNavigation: false
    format: inputDateDTPickerFormat
    minView: 2
    viewSelect: 4


module.exports = class EventPopOver extends PopoverView

    titleTemplate: require './templates/popover_title'
    template: require './templates/popover_event'


    events:
        'keyup':                                 'onKeyUp'
        'change select':                         'onKeyUp'
        'change input':                          'onKeyUp'

        'click .add':                            'onAddClicked'
        'click .advanced-link':                  'onAdvancedClicked'

        'click .remove':                         'onRemoveClicked'
        'click .duplicate':                      'onDuplicateClicked'
        'click .close':                          'selfclose'

        'changeTime.timepicker .input-start':    'onSetStart'
        'changeTime.timepicker .input-end-time': 'onSetEnd'
        'changeDate .input-end-date':            'onSetEnd'
        'click .input-allday':                   'toggleAllDay'

        'input .input-desc':                     'onSetDesc'
        'input .input-place':                    'onSetPlace'

        'keydown [data-tabindex-next]':          'onTab'
        'keydown [data-tabindex-prev]':          'onTab'


    initialize: (options) ->
        if not @model
            @model = new Event
                start: options.start.toISOString()
                end: options.end.toISOString()
                description: ''
                place: ''

        super options

        @listenTo @model, 'change', @refresh

        @options = options


    afterRender: ->
        @addButton    = @$ '.btn.add'
        @removeButton = @$ '.remove'
        @spinner = @$ '.remove-spinner'
        @duplicateButton = @$ '.duplicate'
        @$container   = @$ '.popover-content-wrapper'

        timepickerEvents =
            'focus': ->
                $(@).timepicker 'highlightHour'
            'timepicker.next': ->
                $("[tabindex=#{+$(@).attr('tabindex') + 1}]").focus()
            'timepicker.prev': ->
                $("[tabindex=#{+$(@).attr('tabindex') - 1}]").focus()

        if @model.isNew()
            @removeButton.hide()
            @duplicateButton.hide()

        @$('input[type="time"]').attr('type', 'text')
                                .timepicker defTimePickerOpts
                                .delegate timepickerEvents
        @$('input[type="date"]').attr('type', 'text')
                                .datetimepicker defDatePickerOps
        @$('[tabindex=1]').focus()

        @calendar = new ComboBox
            el: @$ '.calendarcombo'
            small: true
            source: app.calendars.toAutoCompleteSource()

        # Set default calendar value.
        @model.setCalendar @calendar.value()
        @calendar.on 'edition-complete', (value) => @model.setCalendar value

        @refresh()


    # Set captions contents, taking care of event state (all-day, same day, etc)
    setCaptions: ->
        @$('.end-date .caption').html =>
            if @model.isAllDay()
                if @model.isSameDay()
                    str = 'All one day'
                else
                    str = 'All day, until'
            else
                return ',&nbsp;'
            t str


    getTitle: ->
        if @model.isNew()
            title = "#{@type} creation"
        else
            title = "edit #{@type}"

        return t title


    getRenderData: ->

        # A new event's calendar is the first calendar in alphabetical order
        # It fallbacks to the default calendar name if anything goes wrong
        firstCalendar = app.calendars?.at(0)?.get 'name'
        defaultCalendar = t 'default calendar name'
        if @model.isNew()
            currentCalendar = firstCalendar or defaultCalendar
        else
            currentCalendar = @model.get('tags')?[0] or defaultCalendar

        data = _.extend {}, @model.toJSON(),
            tFormat:     tFormat
            dFormat:     dFormat
            editionMode: not @model.isNew()
            advancedUrl: "#{@parentView.getUrlHash()}/#{@model.id}"
            calendar:    currentCalendar
            allDay:      @model.isAllDay()
            sameDay:     @model.isSameDay()
            start:       @model.getStartDateObject()
            end:         @model.getEndDateObject()
                               .add((if @model.isAllDay() then -1 else 0), 'd')


    # Loop over controls elements w/o exiting the popover scope
    onTab: (ev) =>
        # Early return if the key pressed isn't `tab` (keyCode == 9)
        return unless ev.keyCode is 9
        # Find if the element has an explicit next/prev control, and if it fits
        # w/ loop direction (forward/backward over controls)
        $this = $(ev.target)
        if not ev.shiftKey and $this.is '[data-tabindex-next]'
            index = $this.data 'tabindex-next'
        if ev.shiftKey and $this.is '[data-tabindex-prev]'
            index = $this.data 'tabindex-prev'
        # Early return if no index is found
        return unless index
        # Set focus to the targetted element and prevent focusing to fix the
        # overlooping effect (directly jump to the next/prev element rather than
        # the declared one)
        @$("[tabindex=#{index}]").focus()
        ev.preventDefault()


    onSetStart: ->
        @model.setStart @formatDateTime @$('.input-start').val()


    onSetEnd: ->
        @model.setEnd @formatDateTime @$('.input-end-time').val(),
                                      @$('.input-end-date').val()

        # We put or remove a top-level class on the popover body that target if
        # the event is one day long or not
        @$container.toggleClass 'is-same-day', @model.isSameDay()
        @setCaptions()


    toggleAllDay: ->
        # NOTE: I'm not especially fan to set models logics in the view.
        #
        # Maybe we should handle those kind of changes inside the model
        # directly. Need to revamp the model event view also.
        start = @model.getStartDateObject()
        end = @model.getEndDateObject()
        if @$('.input-allday').is ':checked'
            @model.set 'start', start.format(allDayDateFieldFormat)
            @model.set 'end', end.add(1, 'd').format(allDayDateFieldFormat)
        else
            @model.set 'start', start.hour(12).toISOString()
            @model.set 'end', start.hour(13).toISOString()

        # Set labels, captions and views states
        @$('.timed').attr 'aria-hidden', @model.isAllDay()
        @$container.toggleClass 'is-all-day', @model.isAllDay()
        @setCaptions()


    onSetDesc: (ev) ->
        @model.set 'description', ev.target.value


    onSetPlace: (ev) ->
        @model.set 'place', ev.target.value


    onAdvancedClicked: (event) =>
        if @model.isNew()
            modal = new EventModal
                model: @model
                backurl: window.location.hash
            $('body').append modal.$el
            modal.render()
        else
            window.location.hash += "/#{@model.id}"

        event.preventDefault()
        @selfclose()


    onKeyUp: (event) ->
        if event.keyCode is 13 or event.which is 13 #ENTER
            # Forces the combobox to blur to save the calendar if it has changed
            @calendar.onBlur()
            # Update start and end too.
            @onSetStart()
            @onSetEnd()

            @addButton.click()
        else if event.keyCode is 27 # ESC
            @selfclose()
        else
            @addButton.removeClass 'disabled'


    formatDateTime: (timeStr = '', dateStr = '') ->
        t = timeStr.match /([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/
        d = splitted = dateStr.match /([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})/

        [hour, minute] = t[1..2] if t?[0]
        [date, month, year] = d[1..3] if d?[0]

        date = +date + 1 if date and @model.isAllDay() # Add a day later if
                                                       # event is all-day long
        month = +month - 1 if month # Months are 0 indexed in moment.js

        setObj = { hour, minute, date, month, year }


    onRemoveClicked: ->
        if confirm t('are you sure')
            @spinner.show()
            @removeButton.hide()
            @model.destroy
                wait: true
                error: ->
                    alert t('server error occured')
                complete: =>
                    @spinner.show()
                    @selfclose()


    # When duplicate button is clicked, an new event with exact same date
    # is created.
    onDuplicateClicked: ->
        attrs = []
        attrs[key] = value for key, value of @model.attributes
        delete attrs.id
        delete attrs._id

        calendarEvent = new Event attrs
        calendarEvent.save()


    onAddClicked: ->
        return if @$('.btn.add').hasClass 'disabled'
        @addButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addButton.spin 'small'
        errors = @model.validate @model.attributes
        if errors
            @addButton.html @getButtonText()
            @addButton.children().show()

            @addButton.spin()
            @$('.alert').remove()
            @$('input').css 'border-color', ''
            @handleError err for err in errors

        else #no errors.
            @model.save {},
                wait: true
                success: =>
                    @calendar.save()
                    app.events.add @model
                error: ->
                    alert 'server error occured'
                complete: =>
                    @addButton.spin false
                    @addButton.html @getButtonText()
                    @addButton.children().show()
                    @selfclose()


    selfclose: ->
        # Revert if not just saved with addButton.
        if @model.isNew()
            super()
        else
            @model.fetch complete: super


    close: ->
        # we don't reuse @selfclose because both are doing mostly the same thing
        # but are a little bit different.
        # Revert if not just saved with addButton.
        if @model.isNew()
            super()
        else
            @model.fetch complete: super


    refresh: ->
        # We must apply a delta when an event is all-day long, because it starts
        # one day, and finishes the day after (if its duration is one day). But
        # we don't want to display the day afteras endDate, but the start day.
        #
        # e.g.: you set a all-day long event on 15/01/2015. The event starts at
        # 15/01/2015 and finishes at 16/01/2015, but we want to display the
        # event as starting and finishing on 15/01/2015.
        delta = if @model.isAllDay() then -1 else 0
        end = @model.getEndDateObject().add(delta, 'd')

        @$('.input-start').timepicker 'setTime', @model.getStartDateObject().format(tFormat), true, true
        @$('.input-end-time').timepicker 'setTime', end.format(tFormat), true, true
        @$('.input-end-date').val end.format(dFormat)


    handleError: (error) ->
        switch error.field
            when 'description'
                guiltyFields = '.input-desc'

            when 'startdate'
                guiltyFields = '.input-start'

            when 'enddate'
                guiltyFields = '.input-end-time, .input-end-date'

            when 'date'
                guiltyFields = '.input-start, .input-end-time, .input-end-date'

        @$(guiltyFields).css('border-color', 'red')
        @$(guiltyFields).focus()
        alertMsg = $('<div class="alert"></div>').text(t(error.value))
        @$('.popover-content').before alertMsg


    getButtonText: ->
        if @model.isNew() then t('create') else t('edit')

