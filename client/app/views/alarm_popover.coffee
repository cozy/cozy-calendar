PopOver = require './popover'
View = require '../lib/view'
Alarm = require '../models/alarm'
timezones = require('helpers/timezone').timezones

EventPopOver = require './event_popover'
eventFormSmallTemplate = require('./templates/event_form_small')

module.exports = class AlarmPopOver extends PopOver

    constructor: (@cal) ->
        super @cal

    clean: ->
        super()
        @action = null

    unbindEvents: ->
        super()
        @popoverWidget.find('button.add-event').unbind 'click'
        @popoverWidget.find('input').unbind 'keyup'

    createNew: (data) ->
        @clean()
        super data
        @action = data.action
        @modelEvent = data.modelEvent

    show: (title, direction, content) ->
        super title, direction, content
        @popoverWidget.find('input').focus()
        @direction = direction

        if @action is 'create'
            $('.remove').hide()
        else
            $('.remove').show()

    bindEvents: ->        
        super()
        @addEventButton = @popoverWidget.find 'button.add-event'
        @addEventButton.click => @onEventButtonClicked()
        @alarmDescription = @popoverWidget.find 'input'
        @alarmTimezone = @popoverWidget.find 'input-timezone'
        $('.popover #input-timezone').change () =>
            @addButton.removeClass 'disabled'

        @alarmDescription.keyup (event) =>
            if @alarmDescription.val() is ''
                @addButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onButtonClicked()
            else
                @addButton.removeClass 'disabled'

    bindEditEvents: =>
        super()
        @alarmDescription = @popoverWidget.find 'input'
        @alarmTimezone = @popoverWidget.find 'input-timezone'        
        $('.popover #input-timezone').change () =>
            @addButton.removeClass 'disabled'
        
        @alarmDescription.keyup (event) =>
            if @alarmDescription.val() is ''
                @addButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEditClicked()
            else
                @addButton.removeClass 'disabled'

    onRemoveClicked: =>
        super()
        @clean

    onButtonClicked: =>
        value = @popoverWidget.find('input').val()
        dueDate =  @formatDate value
        value = value.replace(/(( )?((at|à) )?[0-9]?[0-9]:[0-9]{2})/, '')
        value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') # trim

        data =
            description: value
            action: 'DISPLAY'
            trigg: dueDate.format Alarm.dateFormat
        if $('.popover #input-timezone').val() isnt "Use specific timezone"
            data.timezone = $('.popover #input-timezone').val()

        super data
        @clean()

    onEditClicked: =>
        data =
            description: @alarmDescription.val()
        if $('.popover #input-timezone').val() isnt "Use specific timezone"
            data.timezone = $('.popover #input-timezone').val()
        super data, (success) =>
            if success
                @event.title = data.description
                @event.timezone = data.timezone
                @cal.fullCalendar 'renderEvent', @event
                
    onEventButtonClicked: () =>
        @field.popover('destroy').popover()
        @pop = new EventPopOver @cal
        @pop.createNew
            field: @field
            date: @date
            action: 'create'
            model: @modelEvent

        eventFormTemplate = eventFormSmallTemplate
            editionMode: false
            defaultValueStart: ''
            defaultValueEnd: ''
            defaultValuePlace: ''
            defaultValueDesc: ''
        @pop.show t("Event creation"), @direction , eventFormTemplate
        @pop.bindEvents @date