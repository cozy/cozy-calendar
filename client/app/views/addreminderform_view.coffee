View = require '../lib/view'
AddAlarmFormView = require './addalarmform_view'
helpers = require '../helpers'

module.exports = class AddReminderFormView extends View

    el: '#add-reminder'

    events:
        'focus #inputDesc': 'onFocus'
        'blur #inputDesc': 'onBlur'
        'keyup #inputDesc': 'onKeydown'
        'click .add-alarm': 'onAddAlarm'
        'click .remove-alarm': 'onRemoveAlarm'

    constructor: (options) ->
        super options

        @alarmViews = new Array()

    initialize: ->
        @actions =
            'DISPLAY': 'Popup'
            'EMAIL': 'Email'

        @data = null
        @editionMode = false

    render: ->
        content = super()
        @$el.append content

        @defaultMinHeight = @$el.height()

        @$el.affix({offset: { top: @$el.offset().top - 10}})

        @alarmListView = @$ '#add-alarms'

        @renderAlarm(@getDefaultAction())
        @collapse()

    template: ->
        require './templates/addreminder_form'

    collapse: ->
        unless @$el.hasClass 'affix'
            @$el.parent().css 'min-height', @defaultMinHeight
        @alarmListView.hide 'slow', =>
            if @$el.hasClass 'affix'
                @$el.parent().css 'min-height', @defaultMinHeight
    expand: ->
        @alarmListView.show 'slow', () =>
            # prevent timepicker from being cut
            @alarmListView.css 'overflow', 'visible'
            @$el.parent().css 'min-height', @$el.height()

    onAddAlarm: (event) ->
        @renderAlarm(@getDefaultAction())

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

    onRemoveAlarm: (event) ->
        alarm = $(event.currentTarget).parent().parent()
        index = alarm.prop('id').replace('alarm-', '')

        @alarmViews.splice index, 1 # remove the element from the collection
        alarm.remove()
        for i, item of @alarmViews
            oldID = item.getIndex()
            item.id = "alarm-#{i}"
            item.$el.prop 'id', item.id
            item.$('select').prop 'id', "action#{i}"
            item.$("label[for='inputDate#{oldID}']").prop 'for', "inputDate#{i}"
            item.$("#inputDate#{oldID}").prop 'id', "inputDate#{i}"
            item.$("label[for=\"inputTime#{oldID}\"]").prop 'for', "inputTime#{i}"
            item.$("#inputTime#{oldID}").prop 'id', "inputTime#{i}"

    onFocus: ->
        @expand()

    onBlur: ->
        if @$('#inputDesc').val() is ''
            @collapse()

    onKeydown: (event) ->
        if $(event.target).val() is ''
            @disableSubmitButton()
        else
            @enableSubmitButton()

    enableSubmitButton: ->
        $('.add-reminder').removeClass('disabled')

    disableSubmitButton: ->
        $('.add-reminder').addClass('disabled')

    loadReminderData: (reminder) ->
        @resetForm(false)
        @$('#inputDesc').val reminder.get 'description'

        @data = reminder

        @editionMode = true
        @$('button.add-reminder').html 'Edit the reminder'

        reminder.alarms.forEach (item) =>
            @renderAlarm item.get('action'), item.getDateObject()

        @enableSubmitButton()
        @expand()

    resetForm: (setNewAlarm) ->

        setNewAlarm = true unless setNewAlarm?

        @data = null
        @editionMode = false
        @$('button.add-reminder').html 'Add the reminder'
        @disableSubmitButton()

        @$('input').val ''
        @alarmListView.empty()
        @alarmViews = new Array()
        @renderAlarm(@getDefaultAction()) if setNewAlarm

    renderAlarm: (defaultAction, dateObject) ->

        button = @$('.add-alarm')
        button.removeClass('add-alarm').addClass('remove-alarm')
        button.find('i').removeClass('icon-plus').addClass('icon-minus')

        newIndex = @alarmViews.length

        alarmView = new AddAlarmFormView
                        id: "alarm-#{newIndex}"

        @alarmViews.push alarmView

        dateObject = new XDate() unless dateObject?

        options =
            defaultAction: defaultAction
            defaultDateObject: dateObject
            actions: @actions

        render = alarmView.render(options).$el
        @alarmListView.append render

