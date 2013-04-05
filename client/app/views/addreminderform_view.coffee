View = require '../lib/view'
AddAlarmFormView = require './addalarmform_view'

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

    render: ->
        content = super()
        @$el.append content

        @defaultMinHeight = @$el.height()

        @$el.affix({offset: { top: @$el.offset().top - 10}})

        @alarmListView = @$ '#add-alarms'

        @renderAlarm(@getDefaultAction())
        @alarmListView.hide()

    template: ->
        require './templates/addreminder_form'

    onAddAlarm: (event) ->
        button = @$('.add-alarm')
        button.removeClass('add-alarm').addClass('remove-alarm')
        button.find('i').removeClass('icon-plus').addClass('icon-minus')

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
            item.id = "alarm-#{i}"
            item.$el.prop 'id', item.id

        @onBlur()

    onFocus: ->

        @alarmListView.show 'slow', () =>
            @$el.parent().css 'min-height', @$el.height()

    onBlur: ->
        if @$('#inputDesc').val() is ''
            unless @$el.hasClass 'affix'
                @$el.parent().css 'min-height', @defaultMinHeight
            @alarmListView.hide 'slow', =>
                if @$el.hasClass 'affix'
                    @$el.parent().css 'min-height', @defaultMinHeight

    onKeydown: (event) ->
        if $(event.target).val() is ''
            $('.add-reminder').addClass('disabled')
        else
            $('.add-reminder').removeClass('disabled')

    resetForm: ->
        @$('input').val ''
        @alarmListView.empty()
        @alarmViews = new Array()
        @renderAlarm(@getDefaultAction())

    renderAlarm: (defaultAction) ->
        newIndex = @alarmViews.length

        alarmView = new AddAlarmFormView
                        id: "alarm-#{newIndex}"

        @alarmViews.push alarmView

        render = alarmView.render(defaultAction, @actions).$el
        @alarmListView.append render

