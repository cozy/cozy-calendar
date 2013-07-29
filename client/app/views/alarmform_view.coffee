View = require '../lib/view'
timezones = require('helpers/timezone').timezones

module.exports = class AlarmFormView extends View

    el: '#add-alarm'

    events:
        'focus #inputDesc': 'onFocus'
        'blur #alarm-description-input': 'onBlur'
        'keyup #alarm-description-input': 'onKeydown'
        'click .add-alarm': 'onSubmit'

    initialize: ->
        @actions =
            'DISPLAY': 'Popup'
            'EMAIL': 'Email'

        @data = null
        @editionMode = false 
        timezoneData = []
        for timezone in timezones
            timezoneData.push value: timezone
        @timezones = timezoneData

    render: ->

        todayDate = Date.create('now')
        content = super
            actions: @actions
            defaultAction: @getDefaultAction('DISPLAY')
            defaultTimezone:"Use specific timezone"
            timezones: @timezones
            defaultDate: todayDate.format '{dd}/{MM}/{yyyy}'
            defaultTime: todayDate.format '{HH}:{mm}'
        @$el.append content

        # prevent the affix from bugging
        @$el.parent().css 'min-height', @$el.height() + 40

        @$el.affix({offset: { top: @$el.offset().top - 10}})

    afterRender: ->
        @descriptionField = @$('#alarm-description-input')
        @actionField = @$('#action')
        @dateField = @$('#inputDate input')
        @timeField = @$('#inputTime')
        @timezoneField = @$('#inputTimezone')

        @addAlarmButton = @$('button.add-alarm')
        @disableSubmitButton()

        @validationMapper =
            action:
                field: @actionField
                placement: 'left'
            description:
                field: @descriptionField
                placement: 'top'
            triggdate:
                field: @$('#date-control')
                placement: 'bottom'

        datePicker = @dateField.datepicker
                            weekStart: 1
                            format: 'dd/mm/yyyy'
        datePicker.on 'changeDate', ->
            $(@).datepicker 'hide'

        @timeField.timepicker
            minuteStep: 1
            showMeridian: false

        @descriptionField.focus()

    template: ->
        require './templates/alarm_form'

    # defaultAction is an optional parameter
    getDefaultAction: (defaultAction) ->

        defaultAction = 'DISPLAY' unless defaultDefaultAction?

        selectedOptions = @$('.controls.form-inline option').filter(':selected')
        actionsAlreadySelected = []

        selectedOptions.each (index, item) ->
            itemValue =  $(item).val()
            if actionsAlreadySelected.indexOf(itemValue) is -1
                actionsAlreadySelected.push itemValue

        for action of @actions
            if actionsAlreadySelected.indexOf(action) is -1
                return action

        return defaultAction
        
    onKeydown: (event) ->
        console.log event.keyCode

        if @descriptionField.val() is ''
            @disableSubmitButton()
        else if event.keyCode is 13 or event.which is 13
            @onSubmit()
        else
            @enableSubmitButton()

    enableSubmitButton: ->
        @addAlarmButton.removeClass('disabled')

    disableSubmitButton: ->
        @addAlarmButton.addClass('disabled')

    loadAlarmData: (alarm) ->
        @resetForm()
        @descriptionField.val alarm.get 'description'
        @dateField.val alarm.getFormattedDate '{dd}/{MM}/{yyyy}'
        @timeField.val alarm.getFormattedDate '{HH}:{mm}'
        @timezoneField.val alarm.get 'timezone'

        @data = alarm

        @editionMode = true
        @addAlarmButton.html 'Edit the alarm'

        @enableSubmitButton()

    resetForm: () ->
        @data = null
        @editionMode = false
        @addAlarmButton.html 'add the alarm'
        @disableSubmitButton()

        @descriptionField.val ''
        todayDate = new Date.create('now')
        @dateField.val todayDate.format '{dd}/{MM}/{yyyy}'
        @timeField.val todayDate.format '{HH}:{mm}'

        @resetErrors()

    displayErrors: (validationErrors) ->

        validationErrors.forEach (err) =>

            data = @validationMapper[err.field]
            data.field
                .tooltip(
                        title: err.value
                        placement: data.placement
                        container: @$el
                        trigger: 'manual')
                .tooltip('show')

    resetErrors: ->
        for index, mappedElement of @validationMapper
            mappedElement.field.tooltip('destroy')

    onSubmit: =>
        @resetErrors()
