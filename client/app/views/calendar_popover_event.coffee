PopoverView = require '../lib/popover_view'
EventModal  = require 'views/event_modal'
ComboBox    = require 'views/widgets/combobox'
Event       = require 'models/event'

helpers = require '../helpers'


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

# Define the available options to create alerts.
# Key is the unit M: minute, H: hour, D: day, and W: week
# Value is the number of units.
ALERT_OPTIONS = [
    {M: 0}
    {M: 15}
    {M: 30}
    {H: 1}
    {H: 2}
    {H: 6}
    {H: 12}
    {D: 1}
    {D: 2}
    {D: 3}
    {D: 5}
    {W: 1}
]


module.exports = class EventPopOver extends PopoverView

    # TODO: rework the screen mechanism in order to use separate views.
    screens:
        default:
            title: require './templates/popover_title'
            content: require './templates/popover_event'
            afterRender: -> @afterRenderDefault()
        details:
            title: -> '<div class="popover-back"><i class="fa fa-angle-left"></i><h4>Description</h4><div class="btn-done">Done</div></div>'
            content: require './templates/popover_details'
            onLeave: -> @onLeaveDetailsScreen()
        alert:
            title: -> '<div class="popover-back"><i class="fa fa-angle-left"></i><h4>Alerts</h4><div class="btn-done">Done</div></div>'
            content: require './templates/popover_alert'
            afterRender: -> @afterRenderAlert()
        repeat:
            title: -> '<div class="popover-back"><i class="fa fa-angle-left"></i><h4>Repeat</h4><div class="btn-done">Done</div></div>'
            content: require './templates/popover_repeat'


    templateAlertRow: require './templates/popover_alert_row'

    events:
        # Popover's generic events.
        'keyup':                'onKeyUp'
        'change select':        'onKeyUp'
        'change input':         'onKeyUp'

        'click .add':           'onAddClicked'
        'click .advanced-link': 'onAdvancedClicked'

        'click .remove':        'onRemoveClicked'
        'click .duplicate':     'onDuplicateClicked'
        'click .close':         'selfclose'

        'click div.popover-back': -> @switchToScreen 'default'

        # Default screen's events.
        'changeTime.timepicker [data-screen="default"] .input-start':    'onSetStart'
        'changeTime.timepicker [data-screen="default"] .input-end-time': 'onSetEnd'
        'changeDate [data-screen="default"] .input-end-date':            'onSetEnd'
        'click [data-screen="default"] .input-allday':                   'toggleAllDay'

        'input [data-screen="default"] .input-desc':                     'onSetDesc'
        'input [data-screen="default"] .input-place':                    'onSetPlace'

        'keydown [data-screen="default"] [data-tabindex-next]':          'onTab'
        'keydown [data-screen="default"] [data-tabindex-prev]':          'onTab'

        'click [data-screen="default"] .input-details-trigger': -> @switchToScreen 'details'

        'click [data-screen="default"] .input-alert': -> @switchToScreen 'alert'

        'click [data-screen="default"] .input-repeat': -> @switchToScreen 'repeat'

        # Alert screen's events.
        'change [data-screen="alert"] .new-alert': 'onNewAlert'
        'click [data-screen="alert"] .alerts li .fa-close': 'onRemoveAlert'
        'click [data-screen="alert"] input[type="checkbox"]': 'onChangeActionAlert'


    initialize: (options) ->
        if not @model
            @model = new Event
                start: options.start.toISOString()
                end: options.end.toISOString()
                description: ''
                place: ''

        super options

        @listenTo @model, 'change', @refresh


    afterRender: ->
        @addButton    = @$ '.btn.add'
        @removeButton = @$ '.remove'
        @spinner = @$ '.remove-spinner'
        @duplicateButton = @$ '.duplicate'
        @$container   = @$ '.popover-content-wrapper'


    afterRenderDefault: ->
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

        # Chrome is really bad with HTML5 form so it always get an error of
        # validation. As a result we don't use a type=date, but a type=text.
        @$('.input-date').datetimepicker defDatePickerOps

        @$('[tabindex=1]').focus()

        @calendar = new ComboBox
            el: @$ '.calendarcombo'
            small: true
            source: app.calendars.toAutoCompleteSource()

        # Set default calendar value.
        @model.setCalendar @calendar.value()
        @calendar.on 'edition-complete', (value) => @model.setCalendar value

        @refresh()


    afterRenderAlert: ->
        $alerts = @$ '.alerts'
        $alerts.empty()

        alarms = @model.get('alarms') or []
        for alarm, index in alarms

            trigger = helpers.iCalDurationToUnitValue alarm.trigg
            {translationKey, value} = @getAlertTranslationInfo trigger
            options =
                index: index
                label: t(translationKey, smart_count: value)
                action: alarm.action
                isEmailChecked: alarm.action in ['EMAIL', 'BOTH']
                isNotifChecked: alarm.action in ['DISPLAY', 'BOTH']

            row = @templateAlertRow options
            $alerts.append row


    # Handle alert removal.
    onRemoveAlert: (event) ->

        # Get which alert to remove.
        index = @$(event.target).parents('li').attr 'data-index'

        # Remove the alert.
        alerts = @model.get('alarms') or []
        alerts.splice index, 1
        @model.set 'alarms', alerts

        # Dirty way to refresh the list.
        @afterRenderAlert()


    # Handle alert action toggle.
    onChangeActionAlert: (event) ->
        checkbox = @$ event.target

        # Get action to toggle.
        isEmailAction = checkbox.hasClass 'action-email'
        action = if isEmailAction then 'EMAIL' else 'DISPLAY'
        otherAction = if action is 'EMAIL' then 'DISPLAY' else 'EMAIL'

        # Get alert index.
        index = checkbox.parents('li').attr 'data-index'

        # Get current action.
        alerts = @model.get 'alarms'
        currentAction = alerts[index].action

        # If two actions are selected, unselect this one.
        if currentAction is 'BOTH'
            newAction = otherAction

        # If the other action is selected, select this one (both are selected).
        else if currentAction is otherAction
            newAction = 'BOTH'

        # Otherwise do nothing, there must be at least one action selected.
        else
            event.preventDefault()

        # Update the alert only if it has changed.
        if newAction?
            alerts[index].action = newAction
            @model.set 'alarms', alerts


    onNewAlert: ->
        index = parseInt @$('select.new-alert').val()

        # 0 is the default placeholder, it's not bound to any real value.
        if index isnt -1

            # Get the ical-formatted value: relative time.
            alertOption = ALERT_OPTIONS[index]
            triggerValue = helpers.unitValuesToiCalDuration alertOption

            # Add it to the list of alarms.
            alarms = @model.get('alarms') or []
            alarms.push
                action: 'DISPLAY'
                trigg: triggerValue

            @model.set 'alarms', alarms

            # Reset selected value
            @$('select.new-alert').val(-1)

            # Dirty way to refresh the list.
            @afterRenderAlert()

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


        formattedAlertOptions = ALERT_OPTIONS.map (alert, index) =>
            translationInfo = @getAlertTranslationInfo alert
            return _.extend {}, translationInfo, {index}

        return data = _.extend {}, @model.toJSON(),
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
            alertOptions: formattedAlertOptions
            alerts: @model.get('alarms')


    getAlertTranslationInfo: (alert) ->
        [unit] = Object.keys(alert)
        translationKey = switch unit
            when 'M' then 'alert minute'
            when 'H' then 'alert hour'
            when 'D' then 'alert day'
            when 'W' then 'alert week'

        value = alert[unit]

        if unit is 'M' and value is 0
            translationKey = 'alert time of event'

        return {translationKey, value}


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
        @model.setStart @formatDateTime @$('.input-start').val(),
                                        @$('.input-start-date').val()


    onSetEnd: ->
        @model.setEnd @formatDateTime @$('.input-end-time').val(),
                                      @$('.input-end-date').val()

        # We put or remove a top-level class on the popover body that target if
        # the event is one day long or not
        @$container.toggleClass 'is-same-day', @model.isSameDay()


    onLeaveDetailsScreen: ->
        value = @$('.input-details').val()
        @model.set 'details', value


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
        @$('.input-time').attr 'aria-hidden', @model.isAllDay()
        @$container.toggleClass 'is-all-day', @model.isAllDay()


    onSetDesc: (ev) ->
        @model.set 'description', ev.target.value


    onSetPlace: (ev) ->
        @model.set 'place', ev.target.value


    # Show more fields when triggered.
    onAdvancedClicked: (event) ->
        event.preventDefault()
        @$('[aria-hidden="true"]').attr 'aria-hidden', false


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
                    @spinner.hide()
                    @selfclose()


    # When duplicate button is clicked, an new event with exact same date
    # is created.
    onDuplicateClicked: ->
        attrs = []
        attrs[key] = value for key, value of @model.attributes
        delete attrs.id
        delete attrs._id

        calendarEvent = new Event attrs
        @duplicateButton.hide()
        @spinner.show()
        calendarEvent.save null,
            wait: true
            success: =>
                @duplicateButton.show()
                @spinner.hide()
            error: =>
                @duplicateButton.show()
                @spinner.hide()


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

        @$('.input-description').val @model.get('details')


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

