PopOver = require './popover'
View = require '../lib/view'
Alarm = require '../models/alarm'

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
        $('.popover #input-time').focus()   

    bindEditEvents: =>
        super()
        @alarmDescription = $('.popover #input-desc')
        @alarmTime = $('.popover #input-time')

        @alarmDescription.keyup (event) =>
            if @alarmDescription.val() is '' and @alarmTime.val() is ''
                @addButton.addClass 'disabled'               
            else if event.keyCode is 13 or event.which is 13
                @onEditClicked()
            else
                @addButton.removeClass 'disabled'

    onRemoveClicked: =>
        super()
        @clean

    onEditClicked: =>
        start =  @formatDate $('.popover #input-time').val()
        data =
            description: $('.popover #input-desc').val()
            trigg: start.format Alarm.dateFormat
        
        super data, (err, alarm) =>
            unless err
                @event.title = data.description
                @event.start = Date.create(alarm.get 'trigg')
                @event.end = Date.create(alarm.get 'trigg').advance
                    minutes: 30
                @event._start = @event.start
                @event._end = @event.end
                @event.title = data.description
                @cal.fullCalendar 'renderEvent', @event
