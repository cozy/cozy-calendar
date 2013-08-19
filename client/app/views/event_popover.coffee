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

    initData: =>
        # Configure start and end dates
        dueStartDate = @formatDate $('.popover #input-start').val()
        specifiedDay = $('.popover #input-end').val().split('+')
        if specifiedDay[1]? and @date?
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
            place: $('.popover #input-place').val()
            description: $('.popover #input-desc').val()
        return data

    onButtonClicked: =>
        data = @initData()
        super data
        @clean()

    onEditClicked: =>
        data = @initData()
        super data, (err, evt) =>
            unless err
                # Update event in calendar
                @event.title = data.description
                startDate = new Date(data.start)
                @event.start = startDate.format Date.ISO8601_DATETIME
                endDate = new Date(data.end)
                @event.end = endDate.format Date.ISO8601_DATETIME
                @event.diff = data.diff
                @event.place = data.place
                @cal.fullCalendar 'renderEvent', @event
