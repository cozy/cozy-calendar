PopOver = require './popover'
Event = require '../models/event'

module.exports = class EventPopOver extends PopOver

    clean: ->
        super()

    unbindEvents: ->
        super()
        @popoverWidget.find('button.close').unbind 'click'
        @popoverWidget.find('button.add-event').unbind 'click'
        @popoverWidget.find('#inputStart').unbind 'keyup'
        @popoverWidget.find('#inputEnd').unbind 'keyup'
        @popoverWidget.find('#inputPlace').unbind 'keyup'
        @popoverWidget.find('#inputDesc').unbind 'keyup'

    createNew: (data) ->
        @clean()
        @field = data.field
        @date = data.date
        @model = data.model
        @event = data.event
        @action = data.action

    show: (title, direction, content) ->
        @field.data('popover', null).popover(
            title: require('./templates/popover_title')().call(null, title: title)
            html: true
            placement: direction
            content: content
        ).popover('show')
        @popoverWidget = $('.container .popover')
        @popoverWidget.find('#inputStart').focus()
        @popoverWidget.find('button.add-event').addClass 'disable'

        if @action is 'create' then $('.event-remove').hide()
        else $('.event-remove').show()

    bindEvents: =>
        @popoverWidget = $('.container .popover')

        @addEventButton = @popoverWidget.find 'button.add-event'

        @popoverWidget.find('button.close').click => @clean()
        @addEventButton.click => @onEventButtonClicked()

        @eventStart = @popoverWidget.find('#inputStart')
        @eventEnd = @popoverWidget.find('#inputEnd')
        @eventPlace = @popoverWidget.find('#inputPlace')
        @eventDescription = @popoverWidget.find('#inputDesc')

        @addEventButton.addClass 'disabled'

        keyReaction = (event) =>
            if @eventStart.val() is '' or
            @eventEnd.val() is '' or
            @eventDescription.val() is ''
                @addEventButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEventButtonClicked()
            else
                @addEventButton.removeClass 'disabled'

        @eventStart.keyup keyReaction
        @eventEnd.keyup keyReaction
        @eventDescription.keyup keyReaction

    bindEditEvents: =>
        @popoverWidget = $('.container .popover')
        @addEventButton = @popoverWidget.find 'button.add-event'
        @closeButton = @popoverWidget.find 'button.close'
        @removeButton = @popoverWidget.find '.event-remove'
        @eventStart = @popoverWidget.find '#inputStart'
        @eventEnd = @popoverWidget.find '#inputEnd'
        @eventPlace = @popoverWidget.find '#inputPlace'
        @eventDescription = @popoverWidget.find '#inputDesc'

        @addEventButton.html @action
        @closeButton.click => @clean()
        @addEventButton.click => @onEditEventClicked()
        @removeButton.click => @onRemoveEventClicked()

        keyReaction = (event) =>
            if @eventStart.val() is '' or
            @eventEnd.val() is '' or
            @eventDescription.val() is ''
                @addEventButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEventButtonClicked()
            else
                @addEventButton.removeClass 'disabled'

        @eventStart.keyup keyReaction
        @eventEnd.keyup keyReaction
        @eventDescription.keyup keyReaction

    onRemoveEventClicked: =>
        evt = @model.get @event.id
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        evt.destroy
            success: =>
                @cal.fullCalendar 'removeEvents', @event.id
                @removeButton.spin()
                @removeButton.css 'width', '14px'
                @clean()
            error: ->
                @removeButton.spin()
                @removeButton.css 'width', '14px'
                @clean()
                @clean()

    onEventButtonClicked: =>
        if @addEventButton.hasClass 'disabled'
            return

        # Recover values
        start = $('.popover #inputStart').val()
        end = $('.popover #inputEnd').val()
        place = $('.popover #inputPlace').val()
        description = $('.popover #inputDesc').val()
        specifiedTime = start.split(':')

        # Configure start and end dates
        dueStartDate = Date.create(@date)
        dueStartDate.set
            hours: specifiedTime[0]
            minutes: specifiedTime[1]

        specifiedDay = end.split('+')
        specifiedTime = specifiedDay[0].split(':')
        if specifiedDay[1]?
            newDate = @date.advance
                days: specifiedDay[1]
            dueEndDate = Date.create(newDate)
        else
            specifiedDay[1] = 0
            dueEndDate = Date.create(@date)
        dueEndDate.set
            hours: specifiedTime[0]
            minutes: specifiedTime[1]

        # Store new event
        data =
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            diff: parseInt(specifiedDay[1])
            place: place
            description: description
        @addEventButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addEventButton.spin 'tiny'
        @model.create data,
            wait: true
            success: =>
                @clean()
                @addEventButton.spin()
                @addEventButton.html @action
            error: =>
                @clean()
                @addEventButton.spin()
                @addEventButton.html @action

    onEditEventClicked: =>
        # Recover values
        evt = @model.get @event.id
        start = $('.popover #inputStart').val()
        end = $('.popover #inputEnd').val()
        place = $('.popover #inputPlace').val()
        description = $('.popover #inputDesc').val()
        specifiedTime = start.split(':')

        # Configure start and end dates
        dueStartDate = Date.create(@date)
        dueStartDate.set
            hours: specifiedTime[0]
            minutes: specifiedTime[1]

        specifiedDay = end.split('+')
        specifiedTime = specifiedDay[0].split(':')
        if specifiedDay[1]?
            newDate = @date.advance
                days: specifiedDay[1]
            dueEndDate = Date.create(newDate)
        else
            specifiedDay[1] = 0
            dueEndDate = Date.create(@date)
        dueEndDate.set
            hours: specifiedTime[0]
            minutes: specifiedTime[1]

        # Store new event
        data =
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            place: place
            diff: parseInt(specifiedDay[1])
            description: description
        @cal.fullCalendar 'renderEvent', @event
        @addEventButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addEventButton.spin 'tiny'
        evt.save data,
            wait: true
            success: =>
                # Update event in calendar
                @event.title = data.description
                startDate = new Date(data.start)
                @event.start = startDate.format Date.ISO8601_DATETIME
                endDate = new Date(data.end)
                @event.end = endDate.format Date.ISO8601_DATETIME
                @event.diff = data.diff
                @event.place = data.place
                @cal.fullCalendar 'renderEvent', @event
                @addEventButton.spin()
            error: ->
                @cal.fullCalendar 'renderEvent', @event
                @addEventButton.spin()
