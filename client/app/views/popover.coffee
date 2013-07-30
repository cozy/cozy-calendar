View = require '../lib/view'

module.exports = class PopOver extends View

    constructor: (@cal) ->

    clean: ->
        @field?.popover 'destroy'
        @field = null
        @date = null
        @unbindEvents() if @popoverWidget?
        @popoverWidget?.hide()

    unbindEvents: ->
        @popoverWidget.find('button.add').unbind 'click'
        @popoverWidget.find('button.close').unbind 'click'

    createNew: (data) ->
        @field = data.field
        @date = data.date
        @model = data.model
        @event = data.event

    show: (title, direction, content) ->
        if $(window).width() < 600
            direction = 'bottom'

        @field.data('popover', null).popover(
            title: require('./templates/popover_title')(title: title)
            html: true
            placement: direction
            content: content
        ).popover('show')
        @popoverWidget = $('.container .popover')

    bindEvents: ->
        @keyReaction = (event) =>
            if @eventStart.val() is '' or  @eventEnd.val() is '' or
            @eventDescription.val() is ''
                @addButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onButtonClicked()
            else
                @addButton.removeClass 'disabled'

        @popoverWidget = $('.container .popover')
        @addButton = @popoverWidget.find 'button.add'
        @addButton.html @action
        @addButton.click => @onButtonClicked()
        @popoverWidget.find('button.close').click => @clean()
        @addButton.addClass 'disabled'

    bindEditEvents: =>
        @keyReaction = (event) =>
            if @checkField
                @addButton.addClass 'disabled'
            else if event.keyCode is 13 or event.which is 13
                @onEditClicked()
            else
                @addButton.removeClass 'disabled'

        @addButton = @popoverWidget.find 'button.add'
        @popoverWidget = $('.container .popover')
        @closeButton = @popoverWidget.find 'button.close'
        @removeButton = @popoverWidget.find '.remove'
        @removeButton.click => @onRemoveClicked()
        @addButton.html @action
        @closeButton.click => @clean()
        @addButton.click => @onEditClicked()

    onRemoveClicked: =>
        evt = @model.get @event.id
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        evt.destroy
            success: =>
                @cal.fullCalendar 'removeEvents', @event.id
                @removeButton.spin()
                @removeButton.css 'width', '14px'
            error: ->
                @removeButton.spin()
                @removeButton.css 'width', '14px'

    formatDate: (value) ->
        # Intitialize new alarm
        dueDate = Date.create @date
        dueDate.advance hours: 8 if dueDate.format('{HH}:{mm}') is '00:00'

        # smart detection: set the time if the user input has a time
        smartDetection = value.match(/([0-9]?[0-9]:[0-9]{2})/)
        if smartDetection? and smartDetection[1]?
            specifiedTime = smartDetection[1]
            specifiedTime = specifiedTime.split /:/
            dueDate.set
                hours: specifiedTime[0]
                minutes: specifiedTime[1]

            return dueDate

    onButtonClicked: (data) =>
        @addButton.html '&nbsp;'
        @addButton.spin 'small'
        @model.create data,
            wait: true
            success: =>
                @addButton.spin()
                @addButton.html @action
            error: =>
                @clean()
                @addButton.spin()
                @addButton.html @action

    onEditClicked: (data, callback) =>
        evt = @model.get @event.id
        @cal.fullCalendar 'renderEvent', @event
        @addButton.html '&nbsp;'
        @addButton.spin 'small'
        evt.save data,
            wait: true
            success: =>
                @addButton.spin()
                @addButton.html @action
                callback true
            error: =>
                @cal.fullCalendar 'renderEvent', @event
                @addButton.spin()
                @addButton.html @action
                callback false
