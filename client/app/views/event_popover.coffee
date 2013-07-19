View = require '../lib/view'
Event = require '../models/event'

module.exports = class EventPopOver extends View

    constructor: (@cal) ->

    clean: ->
        @field?.popover 'destroy'
        @field = null
        @date = null
        if @popoverWidget?
            @popoverWidget.find('button.close').unbind 'click'
            @popoverWidget.find('button.add-event').unbind 'click'
            @popoverWidget.find('inputStart').unbind 'keyup'
            @popoverWidget.find('inputEnd').unbind 'keyup'
            @popoverWidget.find('inputPlace').unbind 'keyup'
            @popoverWidget.find('inputDesc').unbind 'keyup'
            @popoverWidget?.hide()

    createNew: (data) ->
        @clean()
        @field = data.field
        @date = data.date
        @model = data.model
        @event = data.event

    show: (title, direction, content) ->
        @field.data('popover', null).popover(
            title: '<span>' + title + '&nbsp;<i class="event-remove ' + \
                'icon-trash" /></span> <button type="button" class="close">' + \
                '&times;</button>'
            html: true
            placement: direction
            content: content
        ).popover('show')
        @popoverWidget = $('.container .popover')
        @popoverWidget.find('inputStart').focus()

        if @action is 'create'
            $('.event-remove').hide()
        else
            $('.event-remove').show()

    bindEvents: =>
        @popoverWidget = $('.container .popover')

        @addEventButton = @popoverWidget.find 'button.add-event'

        @popoverWidget.find('button.close').click => @clean()
        @addEventButton.click => @onEventButtonClicked()

        @eventStart = @popoverWidget.find('inputStart')
        @eventEnd = @popoverWidget.find('inputEnd')
        @eventPlace = @popoverWidget.find('inputPlace')
        @eventDescription = @popoverWidget.find('inputDesc')

        @eventStart.keyup (event) =>
            if @eventStart.val() is ''
                @addEventButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEventButtonClicked()
            else
                if @eventEnd.val() is ''
                    @addEventButton.addClass 'disabled'
                    @eventEnd.keyup (event) =>
                        if @eventEnd.val() is ''
                            @addEventButton.addClass 'disabled'
                        else if event.keyCode is 13 or event.which is 13
                            @onEventButtonClicked()
                        else
                            @addEventButton.removeClass 'disabled'
                else 
                    @addEventButton.removeClass 'disabled'

    bindEditEvents: =>
        @popoverWidget = $('.container .popover')
        @addEventButton = @popoverWidget.find 'button.add-event'
        @closeButton = @popoverWidget.find 'button.close'
        @removeButton = @popoverWidget.find '.event-remove'
        @eventStart = @popoverWidget.find 'inputStart'
        @eventEnd = @popoverWidget.find 'inputEnd'
        @eventPlace = @popoverWidget.find 'inputPlace'
        @eventDescription = @popoverWidget.find 'inputDesc'

        @addEventButton.html @action
        @closeButton.click => @clean()
        @addEventButton.click => @onEditEventClicked()
        @removeButton.click => @onRemoveEventClicked()

        @eventStart.keyup (event) =>
            if @eventStart.val() is ''
                @addEventButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEventButtonClicked()
            else
                if @eventEnd.val() is ''
                    @addEventButton.addClass 'disabled'
                    @eventEnd.keyup (event) =>
                        if @eventEnd.val() is ''
                            @addEventButton.addClass 'disabled'
                        else if event.keyCode is 13 or event.which is 13
                            @onEventButtonClicked()
                        else
                            @addEventButton.removeClass 'disabled'
                else 
                    @addEventButton.removeClass 'disabled'

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
        start = $('.popover #inputStart').val()
        end = $('.popover #inputEnd').val()
        place = $('.popover #inputPlace').val()
        description = $('.popover #inputDesc').val()
        specifiedTime = start.split(':')

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

        data = 
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            diff: parseInt(specifiedDay[1])
            place: place
            description: description
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
        evt = @model.get @event.id
        start = $('.popover #inputStart').val()
        end = $('.popover #inputEnd').val()
        place = $('.popover #inputPlace').val()
        description = $('.popover #inputDesc').val()
        specifiedTime = start.split(':')

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
          
        data = 
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            place: place
            diff: parseInt(specifiedDay[1])
            description: description
        @cal.fullCalendar 'renderEvent', @event
        @addEventButton.html '&nbsp;'
        evt.save data,
            wait: true
            success: =>
                @event.title = data.description
                startDate = new Date(data.start)
                @event.start = startDate.format Date.ISO8601_DATETIME
                endDate = new Date(data.end)
                @event.end = endDate.format Date.ISO8601_DATETIME
                @event.diff = data.diff
                @event.place = data.place
                @cal.fullCalendar 'renderEvent', @event
            error: ->
                @cal.fullCalendar 'renderEvent', @event