View = require '../lib/view'

module.exports = class AlarmFormView extends View

    el: '#add-alarm'

    events:
        'focus #inputDesc': 'onFocus'
        'blur #inputDesc': 'onBlur'
        'keyup #inputDesc': 'onKeydown'

    initialize: ->
        @actions =
            'DISPLAY': 'Popup'
            'EMAIL': 'Email'

        @data = null
        @editionMode = false

    render: ->

        todayDate = new XDate()

        content = super
            actions: @actions
            defaultAction: @getDefaultAction('DISPLAY')
            defaultDate: todayDate.toString 'dd/MM/yyyy'
            defaultTime: todayDate.toString 'HH:mm'
        @$el.append content

        # prevent the affix from bugging
        @$el.parent().css 'min-height', @$el.height() + 20

        @$el.affix({offset: { top: @$el.offset().top - 10}})

    afterRender: ->
        @$("#inputDate").datepicker().on 'changeDate', ->
            $(@).datepicker 'hide'

        @$("#inputTime").timepicker
                            minuteStep: 1
                            showMeridian: false

        @descriptionField = @$('#inputDesc')
        @actionField = @$('#action')
        @dateField = @$('#inputDate input')
        @timeField = @$('#inputTime')

        @addAlarmButton = @$('button.add-alarm')

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
        @dateField.val alarm.getFormattedDate 'dd/MM/yyyy'
        @timeField.val alarm.getFormattedDate 'HH:mm'

        @data = alarm

        @editionMode = true
        @addAlarmButton.html 'Edit the alarm'

        @enableSubmitButton()

    resetForm: () ->
        @data = null
        @editionMode = false
        @addAlarmButton.html 'Add the alarm'
        @disableSubmitButton()

        @descriptionField.val ''
        todayDate = new XDate()
        @dateField.val todayDate.toString 'dd/MM/yyyy'
        @timeField.val todayDate.toString 'HH:mm'