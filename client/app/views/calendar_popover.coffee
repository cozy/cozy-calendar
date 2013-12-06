BaseView = require '../lib/base_view'
Alarm = require 'models/alarm'
Event = require 'models/event'

module.exports = class PopOver extends BaseView

    template: require('./templates/popover_content')

    events:
        'keyup input': 'onKeyUp'
        'change select': 'onKeyUp'
        'change input': 'onKeyUp'
        'click .add'  : 'onAddClicked'
        'click .remove': 'onRemoveClicked'
        'click .close' : 'selfclose'
        'click .event': 'onTabClicked'
        'click .alarm': 'onTabClicked'

    initialize: (options) ->
        if options.type
            @type = options.type
            @model = @makeNewModel options

        else if @model
            @type = if @model instanceof Event then 'event' else 'alarm'

        @target = options.target
        @container = options.container
        @parentView = options.parentView

    selfclose: () ->
        @parentView.onPopoverClose?()
        @close()

    close: () ->
        @target.popover 'destroy'
        @target.data('popover', undefined)
        @remove()

    render: ->
        @target.popover(
            selector: true
            trigger: 'manual'
            title: require('./templates/popover_title')(title: @getTitle())
            html: true
            placement: @getDirection()
            content: @template @getRenderData()
        ).popover('show')
        @setElement $('#viewContainer .popover')
        @addButton = @$('.btn.add').text @getButtonText()
        @addButton.toggleClass 'disabled', @validForm()
        @removeButton = @$('.remove')
        @removeButton.hide() if @model.isNew()
        @$('input[type="time"]').attr('type', 'text').timepicker
            template: false
            minuteStep: 5
            showMeridian: false
        @$('.focused').focus()

    validForm: ->
        if @model instanceof Event
            @$('#input-start').val() isnt '' and
            @$('#input-end').val()   isnt '' and
            @$('#input-desc').val()  isnt ''
        else
            @$('#input-desc').val()  isnt '' and
            @$('#input-time').val()  isnt ''

    getTitle: ->
        title = if @model.isNew() then 'creation'
        else 'edit ' + @type
        t(title)

    getDirection: ->
        pos = @target.position()
        fitRight = pos.left + @target.width() + 411 < @container.width()
        fitLeft = pos.left - 411 > 0
        fitBottom = pos.top + @target.height() + 200 < @container.height()
        if not fitLeft and not fitRight
            if fitBottom then 'bottom' else 'top'
        else if fitRight then 'right'
        else 'left'

    getButtonText: -> if @model.isNew() then t('create') else t('edit')

    getRenderData: ->
        data = _.extend type: @type,
            @model.attributes,
            editionMode: not @model.isNew()
            advancedUrl: @parentView.getUrlHash() + '/' + @model.id

        if @model instanceof Event
            endDate = @model.getEndDateObject()
            startDate = @model.getStartDateObject()
            unless @model.isOneDay()
                diff = endDate - startDate
                diff = Math.round(diff / 1000 / 3600 / 24)
            data.start = startDate.format '{HH}:{mm}'
            data.end = endDate.format '{HH}:{mm}'
            data.start = '10:00' if data.start is '00:00'
            data.end = '18:00' if data.end is '00:00'
            data.diff = diff or 0

        else
            data.time = @model.get('timezoneHour')
            # data.time = @model.getDateObject().format '{HH}:{mm}'
            data.timezones = require('helpers/timezone').timezones

        return data

    makeNewModel: (options) ->
        switch @type
            when 'event' then new Event
                start: options.start.format Event.dateFormat, 'en-en'
                end: options.end.format Event.dateFormat, 'en-en'
                description: ''
                place: ''

            when 'alarm' then new Alarm
                trigg: options.start.format Alarm.dateFormat, 'en-en'
                timezone: 'Europe/Paris'
                description: ''
                action: 'DISPLAY'

            else throw new Error 'wrong type'

    onTabClicked: (event) ->
        type = event.target.className
        return false if type is @type
        @parentView.showPopover
            type: type
            target: @options.target
            start:  @options.start
            end:    @options.end

    onKeyUp: (event) -> #
        if not @validForm()
            @addButton.addClass 'disabled'
        else if event.keyCode is 13 or event.which is 13
            @addButton.click()
        else
            @addButton.removeClass 'disabled'

    formatDate: (relativeTo, value) ->
        # Intitialize new alarm
        date = Date.create relativeTo

        # smart detection: set the time if the user input has a time
        splitted = value.match /([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/
        if splitted and splitted[0]
            [all, hours, minutes, diff] = splitted
            date.set {hours: +hours, minutes: +minutes}
            date.advance(days: +diff) if diff

        return date

    getModelAttributes: =>
        if @model instanceof Event
            date = @model.getStartDateObject()
            startDate = @formatDate date, @$('#input-start').val()
            end = @$('#input-end').val() + '+' + @$('#input-diff').val()
            endDate = @formatDate date, end
            data =
                start: startDate.format Event.dateFormat, 'en-en'
                end: endDate.format Event.dateFormat, 'en-en'
                place: @$('#input-place').val()
                description: @$('#input-desc').val()

        else
            data =
                timezone: @$('#input-timezone').val()
                timezoneHour: @$('#input-time').val()
                description: @$('#input-desc').val()

        return data

    onRemoveClicked: =>
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        if confirm 'Are you sure ?'
            @model.destroy
                wait: true
                error: ->
                    alert 'server error occured'
                complete: =>
                    @removeButton.spin()
                    @removeButton.css 'width', '14px'
                    @selfclose()

    onAddClicked: () =>
        return if @$('.btn.add').hasClass 'disabled'
        @addButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addButton.spin 'small'
        noError = @model.save @getModelAttributes(),
            wait: true
            success: =>
                collection = app[@type + 's']
                collection.add @model
            error: =>
                alert 'server error occured'
            complete: =>
                @addButton.spin false
                @addButton.html @getButtonText()
                @selfclose()

        unless noError
            console.log @model.validationError
