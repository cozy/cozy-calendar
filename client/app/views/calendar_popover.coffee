BaseView = require '../lib/base_view'
Alarm = require 'models/alarm'
Event = require 'models/event'

module.exports = class PopOver extends BaseView

    template: require('./templates/popover_content')

    events:
        'keyup input': 'onKeyUp'
        'click button.add'  : 'onAddClicked'
        'click .remove': 'onRemoveClicked'
        'click .close' : 'close'
        'click .event': 'onTabClicked'
        'click .alarm': 'onTabClicked'

    initialize: (options) ->
        if options.type
            @type = options.type
            @model = @makeNewModel options

        else if @model
            @type = if @model instanceof Event then 'event' else 'alarm'

        window.test = this

        @target = options.target
        @container = options.container
        @parentView = options.parentView

    close: ->
        @target.popover 'destroy'
        @target.data('popover', null)
        @remove()

    render: ->
        @target.data('popover', null)
        @target.popover(
            title: require('./templates/popover_title')(title: @getTitle())
            html: true
            placement: @getDirection()
            content: @template @getRenderData()
        ).popover('show')
        @setElement $('.container .popover')
        @addButton = @$('button.add').text @getButtonText()
        @addButton.toggleClass 'disabled', @validForm()
        @removeButton = @$('.remove')
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
        title = (if @model.isNew() then 'create' else 'edit') + ' ' + @type
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
            data.start = @model.getFormattedStartDate('{HH}:{mm}')
            data.end = @getEndDateWithDiff()
        else
            data.time = @model.getDateObject().format '{HH}:{mm}'

        return data

    getEndDateWithDiff: ->
        return null unless @model instanceof Event
        endDate = @model.getEndDateObject()
        startDate = @model.getStartDateObject()
        unless @model.isOneDay()
            diff = endDate - @model.getStartDateObject()
            diff = Math.round(diff / 1000 / 3600 / 24)

        time = @model.getFormattedEndDate('{HH}:{mm}')
        if diff then "#{time}+#{diff}" else time

    makeNewModel: (options) ->
        switch @type
            when 'event' then new Event
                start: options.start
                end: options.end
                description: ''
                place: ''

            when 'alarm' then new Alarm
                trigg: options.start
                timezone: ''
                description: ''
                action: 'DISPLAY'
                place: ''

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
            startDate = @formatDate date, $('.popover #input-start').val()
            endDate = @formatDate date, $('.popover #input-end').val()
            data =
                start: startDate.format Event.dateFormat, 'en-en'
                end: endDate.format Event.dateFormat, 'en-en'
                place: $('.popover #input-place').val()
                description: $('.popover #input-desc').val()

        else
            console.log "HERE"
            date = @model.getDateObject()
            time = @formatDate date, $('.popover #input-time').val()

            data =
                trigg: time.format Alarm.dateFormat
                description: $('.popover #input-desc').val()

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
                    @close()

    onAddClicked: () =>
        @addButton.html '&nbsp;'
        @addButton.spin 'small'
        console.log "there"
        noError = @model.save @getModelAttributes(),
            wait: true
            success: =>
                collection = app[@type+'s']
                collection.add @model
            error: =>
                alert 'server error occured'
            complete: =>
                @addButton.spin()
                @addButton.html @getButtonText()
                @close()

        unless noError
            console.log @model.validationError