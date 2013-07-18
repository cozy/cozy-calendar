View = require '../lib/view'
Alarm = require '../models/alarm'

EventPopOver = require './event_popover'
eventFormSmallTemplate = require('./templates/event_form_small')

module.exports = class AlarmPopOver extends View

    constructor: (@cal) ->

    clean: ->
        @field?.popover 'destroy'
        @field = null
        @date = null
        @action = null
        if @popoverWidget?
            @popoverWidget.find('button.close').unbind 'click'
            @popoverWidget.find('button.add-alarm').unbind 'click'
            @popoverWidget.find('button.add-event').unbind 'click'
            @popoverWidget.find('input').unbind 'keyup'
            @popoverWidget?.hide()

    createNew: (data) ->
        @clean()
        @field = data.field
        @date = data.date
        @action = data.action
        @model = data.model
        @modelEvent = data.modelEvent
        @event = data.event

    show: (title, direction, content) ->
        @field.popover(
            title: '<span>' + title + '&nbsp;<i class="alarm-remove ' + \
                'icon-trash" /></span> <button type="button" class="close">' + \
                '&times;</button>'
            html: true
            placement: direction
            content: content
        ).popover('show')
        @popoverWidget = $('.container .popover')
        @popoverWidget.find('input').focus()

        if @action is 'create'
            $('.alarm-remove').hide()
        else
            $('.alarm-remove').show()

    bindEvents: =>
        @popoverWidget = $('.container .popover')

        @addAlarmButton = @popoverWidget.find 'button.add-alarm'
        @addAlarmButton.html @action
        @addEventButton = @popoverWidget.find 'button.add-event'

        @popoverWidget.find('button.close').click => @clean()
        @addAlarmButton.click => @onAlarmButtonClicked()
        @addEventButton.click => @onEventButtonClicked()

        @alarmDescription = @popoverWidget.find('input')
        @alarmDescription.keyup (event) =>
            if @alarmDescription.val() is ''
                @addAlarmButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onAlarmButtonClicked()
            else
                @addAlarmButton.removeClass 'disabled'

    bindEditEvents: =>
        @popoverWidget = $('.container .popover')
        @addAlarmButton = @popoverWidget.find 'button.add-alarm'
        @addEventButton = @popoverWidget.find 'button.add-event'
        @closeButton = @popoverWidget.find 'button.close'
        @removeButton = @popoverWidget.find '.alarm-remove'
        @alarmDescription = @popoverWidget.find 'input'

        @addAlarmButton.html @action
        @closeButton.click => @clean()
        @addAlarmButton.click => @onEditAlarmClicked()
        @removeButton.click => @onRemoveAlarmClicked()

        @alarmDescription.keyup (event) =>
            if @alarmDescription.val() is ''
                @addAlarmButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEditAlarmClicked()
            else
                @addAlarmButton.removeClass 'disabled'

    onRemoveAlarmClicked: =>
        alarm = @model.get @event.id
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        alarm.destroy
            success: =>
                @cal.fullCalendar 'removeEvents', @event.id
                @removeButton.spin()
                @removeButton.css 'width', '14px'
                @clean()
            error: ->
                @removeButton.spin()
                @removeButton.css 'width', '14px'
                @clean()

    onAlarmButtonClicked: =>
        dueDate = Date.create @date
        dueDate.advance hours: 8 if dueDate.format('{HH}:{mm}') is '00:00'

        # smart detection: set the time if the user input has a time
        value = @popoverWidget.find('input').val()
        smartDetection = value.match(/([0-9]?[0-9]:[0-9]{2})/)

        if smartDetection? and smartDetection[1]?
            specifiedTime = smartDetection[1]
            specifiedTime = specifiedTime.split /:/
            dueDate.set
                hours: specifiedTime[0]
                minutes: specifiedTime[1]

            value = value.replace(/(( )?((at|à) )?[0-9]?[0-9]:[0-9]{2})/, '')
            value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') # trim

        data =
            description: value
            action: 'DISPLAY'
            trigg: dueDate.format Alarm.dateFormat

        @addAlarmButton.html '&nbsp;'
        @addAlarmButton.spin 'small'
        @model.create data,
            wait: true
            success: =>
                @clean()
                @addAlarmButton.spin()
                @addAlarmButton.html @action
            error: =>
                @clean()
                @addAlarmButton.spin()
                @addAlarmButton.html @action

    onEventButtonClicked: () =>
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
        @pop.show "Event creation", @direction , eventFormTemplate
        @pop.bindEvents @date
        @pop.clean()

    onEditAlarmClicked: =>
        alarm = @model.get @event.id
        data = description: @alarmDescription.val()
        @cal.fullCalendar 'renderEvent', @event
        @addAlarmButton.html '&nbsp;'
        @addAlarmButton.spin 'small'
        alarm.save data,
            wait: true
            success: =>
                @event.title = data.description
                @cal.fullCalendar 'renderEvent', @event
                @addAlarmButton.spin()
                @addAlarmButton.html @action
            error: ->
                @cal.fullCalendar 'renderEvent', @event
                @addAlarmButton.spin()
                @addAlarmButton.html @action
