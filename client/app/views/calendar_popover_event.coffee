PopoverView = require '../lib/popover_view'
EventModal  = require 'views/event_modal'
ComboBox    = require 'views/widgets/combobox'
Event       = require 'models/event'


tFormat                 = 'HH:mm'
dFormat                 = 'DD/MM/YYYY'
inputDateDTPickerFormat = 'dd/mm/yyyy'

defTimePickerOpts       =
    template: false
    minuteStep: 5
    showMeridian: false

defDatePickerOps        =
    language: window.app.locale
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
        'keyup input':                           'onKeyUp'
        'change select':                         'onKeyUp'
        'change input':                          'onKeyUp'

        'click .add':                            'onAddClicked'
        'click .advanced-link':                  'onAdvancedClicked'

        'click .remove':                         'onRemoveClicked'
        'click .close':                          'selfclose'

        'changeTime.timepicker .input-start':    'onSetStart'
        'changeTime.timepicker .input-end-time': 'onSetEnd'
        'changeDate .input-end-date':            'onSetEnd'
        'click .input-allday':                   'toggleAllDay'

        'input .input-desc':                     'onSetDesc'
        'input .input-place':                    'onSetPlace'


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
        @addButton = @$ '.btn.add'
        @removeButton = @$ '.remove'

        timepickerEvents =
            'focus': ->
                $(@).timepicker 'highlightHour'
            'timepicker.next': ->
                $("[tabindex=#{+$(@).attr('tabindex') + 1}]").focus()
            'timepicker.prev': ->
                $("[tabindex=#{+$(@).attr('tabindex') - 1}]").focus()

        @removeButton.hide() if @model.isNew()
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

        @calendar.on 'edition-complete', (value) => @model.setCalendar value

        @refresh()


    getTitle: ->
        if @model.isNew()
            title = "#{@type} creation"
        else
            title = "edit #{@type}"

        return t title


    getRenderData: ->
        data = _.extend {}, @model.toJSON(),
            tFormat:     tFormat
            dFormat:     dFormat
            editionMode: not @model.isNew()
            advancedUrl: "#{@parentView.getUrlHash()}/#{@model.id}"
            calendar:    @model.get('tags')?[0] or ''
            allDay:      @model.isAllDay()
            start:       @model.getStartDateObject()
            end:         @model.getEndDateObject()
                               .add((if @model.isAllDay() then -1 else 0), 'd')


    onSetStart: ->
        @model.setStart @formatDateTime @$('.input-start').val()


    onSetEnd: ->
        @model.setEnd @formatDateTime @$('.input-end-time').val(),
                                      @$('.input-end-date').val()


    toggleAllDay: ->
        isAllDay = @$('.input-allday').is ':checked'

        @$('.timed').attr 'aria-hidden', isAllDay

        # NOTE: I'm not especially fan to set models logics in the view. Maybe
        # we should handle those kind of changes inside the model directly.
        start = @model.getStartDateObject()
        end = @model.getEndDateObject()
        if isAllDay
            @model.set 'start', start.format('YYYY-MM-DDD')
            @model.set 'end', end.add(1, 'd').format('YYYY-MM-DDD')
        else
            @model.set 'start', start.hour(12).toISOString()
            @model.set 'end', start.hour(13).toISOString()


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
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        if confirm t('are you sure')
            @model.destroy
                wait: true
                error: ->
                    alert t('server error occured')
                complete: =>
                    @removeButton.spin()
                    @removeButton.css 'width', '14px'
                    @selfclose()
        else @removeButton.spin()


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
                    collection = app['events']
                    collection.add @model
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

        @$('.input-start').val @model.getStartDateObject().format(tFormat)
        @$('.input-end-time').val end.format(tFormat)
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

