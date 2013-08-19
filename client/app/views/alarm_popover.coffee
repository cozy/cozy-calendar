PopOver = require './popover'
View = require '../lib/view'
Alarm = require '../models/alarm'
timezones = require('helpers/timezone').timezones

eventFormSmallTemplate = require('./templates/event_form_small')

module.exports = class AlarmPopOver extends PopOver

    constructor: (@cal) ->
        super @cal

    unbindEvents: ->
        super()
        @popoverWidget.find('button').unbind 'click'
        @popoverWidget.find('.remove').unbind 'click'
        @popoverWidget.find('input').unbind 'keyup'

    show: (title, direction, content) ->
        super title, direction, content
        @popoverWidget.find('input').focus()

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

    onEditClicked: =>
        data =
            description: @alarmDescription.val()
        if $('.popover #input-timezone').val() isnt "Use specific timezone"
            data.timezone = $('.popover #input-timezone').val()
        super data, (err, alarm) =>
            unless err
                @event.title = data.description
                @event.start = Date.create(alarm.get 'trigg')
                @event.end = Date.create(alarm.get 'trigg').advance
                    minutes: 30
                @event._start = @event.start
                @event._end = @event.end
                @cal.fullCalendar 'renderEvent', @event
