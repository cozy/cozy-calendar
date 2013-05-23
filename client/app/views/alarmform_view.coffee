View = require '../lib/view'

module.exports = class AlarmFormView extends View

    el: '#add-alarm'

    events:
        'focus #inputDesc': 'onFocus'
        'blur #inputDesc': 'onBlur'
        'keyup #inputDesc': 'onKeydown'
        'click .add-alarm': 'onSubmit'

    initialize: ->
        @actions =
            'DISPLAY': 'Popup'
            'EMAIL': 'Email'

        @data = null
        @editionMode = false

    render: ->

        todayDate = Date.create('now')

        content = super
            actions: @actions
            defaultAction: @getDefaultAction('DISPLAY')
            defaultDate: todayDate.format '{dd}/{MM}/{yyyy}'
            defaultTime: todayDate.format '{HH}:{mm}'
        @$el.append content

        # prevent the affix from bugging
        @$el.parent().css 'min-height', @$el.height() + 40

        @$el.affix({offset: { top: @$el.offset().top - 10}})

    afterRender: ->
        @descriptionField = @$('#inputDesc')
        @actionField = @$('#action')
        @dateField = @$('#inputDate input')
        @timeField = @$('#inputTime')

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

        @dateField.datepicker({weekStart: 1}).on 'changeDate', ->
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
        if @descriptionField.val() is ''
            @disableSubmitButton()
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

    onSubmit: ->
        @resetErrors()
