View = require '../lib/view'
timezones = require('helpers/timezone').timezones
defaultTimezone = 'timezone'

module.exports = class AlarmFormView extends View

    el: '#add-alarm'

    template: ->
        require './templates/alarm_form'

    events:
        'focus #input-desc': 'onFocus'
        'blur #input-desc': 'onBlur'
        'keyup #input-desc': 'onKeyUp'
        'click .add-alarm': 'onSubmit'
        'click .cancel': 'resetForm'

    initialize: ->
        @actions =
            'DISPLAY': 'Display'
            'EMAIL': 'Email'

        @data = null
        @editionMode = false
        timezoneData = []
        timezoneData.push value: timezone for timezone in timezones
        @timezones = timezoneData

    render: ->
        todayDate = Date.create('now')
        content = super
            actions: @actions
            defaultAction: @getDefaultAction('DISPLAY')
            defaultTimezone:defaultTimezone
            timezones: @timezones
            defaultDate: todayDate.format '{dd}/{MM}/{yyyy}'
            defaultTime: todayDate.format '{HH}:{mm}'
        @$el.append content

    afterRender: ->
        @descriptionField = @$('#input-desc')
        @actionField = @$('#action')
        @dateField = @$('#input-date')
        @timeField = @$('#input-time')
        @timezoneField = @$('#input-timezone')
        @addAlarmButton = @$('button.add-alarm')
        @cancelButton = @$('button.cancel')
        @cancelButton.hide()
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

    getDefaultAction: (defaultAction) ->
        defaultAction = 'DISPLAY' unless defaultDefaultAction?

        selectedOptions = @$('#action').filter(':selected')
        actionsAlreadySelected = []

        selectedOptions.each (index, item) ->
            itemValue =  $(item).val()
            if actionsAlreadySelected.indexOf(itemValue) is -1
                actionsAlreadySelected.push itemValue

        for action of @actions
            if actionsAlreadySelected.indexOf(action) is -1
                return action

        return defaultAction

    onKeyUp: (event) ->
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
        @timezoneField.val alarm.get defaultTimezone
        if alarm.get('timezoneHour')?
            @timeField.val alarm.get 'timezoneHour'
        else            
            @timeField.val alarm.getFormattedDate '{HH}:{mm}'        

        @data = alarm

        @editionMode = true
        @addAlarmButton.html 'Edit the alarm'
        @cancelButton.show()

        @enableSubmitButton()

    resetForm: () ->
        @cancelButton.hide()
        @data = null
        @editionMode = false
        @addAlarmButton.html 'add the alarm'
        @disableSubmitButton()

        @descriptionField.val ''
        todayDate = new Date.create('now')
        @dateField.val todayDate.format '{dd}/{MM}/{yyyy}'
        @timeField.val todayDate.format '{HH}:{mm}'
        @timezoneField.val defaultTimezone
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
