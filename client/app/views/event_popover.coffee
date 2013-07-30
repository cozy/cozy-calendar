PopOver = require './popover'
Event = require '../models/event'

module.exports = class EventPopOver extends PopOver

    constructor: (@cal) ->
        super @cal

    clean: ->
        super()

    unbindEvents: ->
        super()
        @popoverWidget.find('#input-start').unbind 'keyup'
        @popoverWidget.find('#input-end').unbind 'keyup'
        @popoverWidget.find('#input-place').unbind 'keyup'
        @popoverWidget.find('#input-desc').unbind 'keyup'

    createNew: (data) ->
        @clean()
        super data

    show: (title, direction, content) ->
        super title, direction, content
        @popoverWidget.find('#input-start').focus()
        @popoverWidget.find('button.add').addClass 'disable'

        if @action is 'create' then $('.remove').hide()
        else $('.remove').show()

    bindEvents: ->   
        super()
        @eventStart = @popoverWidget.find('#input-start')
        @eventEnd = @popoverWidget.find('#input-end')
        @eventPlace = @popoverWidget.find('#input-place')
        @eventDescription = @popoverWidget.find('#input-desc')

        @eventStart.keyup @keyReaction
        @eventEnd.keyup @keyReaction
        @eventDescription.keyup @keyReaction

    bindEditEvents: =>        
        super()
        @eventStart = @popoverWidget.find '#input-start'
        @eventEnd = @popoverWidget.find '#input-end'
        @eventPlace = @popoverWidget.find '#input-place'
        @eventDescription = @popoverWidget.find '#input-desc'

        @eventStart.keyup @keyReaction
        @eventEnd.keyup @keyReaction
        @eventDescription.keyup @keyReaction

    onRemoveClicked: =>
        super()
        @clean

    onButtonClicked: =>
        if @addButton.hasClass 'disabled'
            return

        # Recover values
        start = $('.popover #input-start').val()
        end = $('.popover #input-end').val()
        place = $('.popover #input-place').val()
        description = $('.popover #input-desc').val()

        # Configure start and end dates
        dueStartDate = @formatDate start
        specifiedDay = end.split('+')
        if specifiedDay[1]?
            newDate = @date.advance
                days: specifiedDay[1]
            dueEndDate = Date.create(newDate)
        else
            specifiedDay[1] = 0
            dueEndDate = Date.create(@date)
        dueEndDate = @formatDate specifiedDay[0]

        # Store new event
        data =
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            diff: parseInt(specifiedDay[1])
            place: place
            description: description
        
        super data
        @clean()

    onEditClicked: =>
        # Recover values
        evt = @model.get @event.id
        start = $('.popover #input-start').val()
        end = $('.popover #input-end').val()
        place = $('.popover #input-place').val()
        description = $('.popover #input-desc').val()

        # Configure start and end dates
        dueStartDate = @formatDate start
        specifiedDay = end.split('+')
        if specifiedDay[1]?
            newDate = @date.advance
                days: specifiedDay[1]
            dueEndDate = Date.create(newDate)
        else
            specifiedDay[1] = 0
            dueEndDate = Date.create(@date)
        dueEndDate = @formatDate specifiedDay[0]

        # Store new event
        data =
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            place: place
            diff: parseInt(specifiedDay[1])
            description: description

        super data, (success) =>
            if success
                # Update event in calendar
                @event.title = data.description
                startDate = new Date(data.start)
                @event.start = startDate.format Date.ISO8601_DATETIME
                endDate = new Date(data.end)
                @event.end = endDate.format Date.ISO8601_DATETIME
                @event.diff = data.diff
                @event.place = data.place
                @cal.fullCalendar 'renderEvent', @event
