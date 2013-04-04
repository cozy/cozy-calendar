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

        scrollTop = @$el.offset().top
        ###$(document).scroll () =>
            currentScroll = $(document).scrollTop()
            if currentScroll >= scrollTop
                #$('#reminders').css 'margin-top', @$el.height() + 20
                @$el.addClass 'affix'
            else
                #$('#reminders').css 'margin-top', 0
                @$el.removeClass 'affix'###

    render: ->
        content = super()
        @$el.append content

        @$el.affix({offset: { top: @$el.offset().top - 10 }})

        @alarmListView = @$ '#add-alarms'

        @renderAlarm(@getDefaultAction())
        @alarmListView.hide()

    template: ->
        require './templates/addreminder_form'

    onAddAlarm: (event) ->
        button = @$('.add-alarm')
        button.removeClass('add-alarm').addClass('remove-alarm')
        button.find('i').removeClass('icon-plus').addClass('icon-minus')

        @renderAlarm(@getDefaultAction)

    # TODO: if there is a DISPLAY alarm, default should be EMAIL
    getDefaultAction: () ->
        return "DISPLAY"

    onRemoveAlarm: (event) ->
        alarm = $(event.currentTarget).parent().parent()
        index = alarm.prop('id').replace('alarm-', '')

        @alarmViews.splice index, 1 # remove the element from the collection
        alarm.remove()

        for i, item of @alarmViews
            item.id = "alarm-#{i}"
            item.$el.prop 'id', item.id

    onFocus: (event) ->

        heightBeforeShow = @$el.height()
        @alarmListView.show 'slow', () =>
            delta = @$el.height() - heightBeforeShow

            if @$el.hasClass 'affix'
                console.debug @$el.height()
                @$el

    onBlur: (event) ->
        @alarmListView.hide('slow') if $(event.target).val() is ''

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

