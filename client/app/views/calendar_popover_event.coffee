PopoverView = require '../lib/popover_view'
EventModal = require 'views/event_modal'
ComboBox = require 'views/widgets/combobox'
Toggle = require 'views/toggle'
Event = require 'models/event'

module.exports = class EventPopOver extends PopoverView

    titleTemplate: require './templates/popover_title'
    template: require './templates/popover_event'
    dtFormat: "HH:mm"
    popoverWidth: 411
    popoverHeight: 200

    events:
        'keyup input': 'onKeyUp'
        'change select': 'onKeyUp'
        'change input': 'onKeyUp'
        'click .add'  : 'onAddClicked'
        'click .advanced-link'  : 'onAdvancedClicked'
        'click .remove': 'onRemoveClicked'
        'click #toggle-type': 'onTabClicked'
        'click .close' : 'selfclose'
        'changeTime.timepicker #input-start': 'onSetStart'
        'changeTime.timepicker #input-end': 'onSetEnd'
        'input #input-diff': 'onSetDiff'
        'input #input-desc': 'onSetDesc'
        'input #input-place': (ev) -> @model.set 'place', ev.target.value

    initialize: (options) ->
        if not @model
            @model = new Event
                start: options.start.toISOString()
                end: options.end.toISOString()
                description: ''
                place: ''

        super options

        @listenTo @model, 'change', @refresh

        @options = options


    afterRender: ->
        @addButton = @$ '.btn.add'
        @removeButton = @$ '.remove'

        @removeButton.hide() if @model.isNew()
        @$('input[type="time"]').attr('type', 'text').timepicker
            template: false
            minuteStep: 5
            showMeridian: false
        @$('.focused').focus()

        if not @model.isAllDay()
            inputEnd = @$('#input-end')
            inputStart = @$('#input-start')
            inputDiff = @$('#input-diff')
            inputStart.on 'timepicker.next', -> inputEnd.focus()
            inputEnd.on 'timepicker.next', -> inputDiff.focus()
            inputEnd.on 'timepicker.prev', ->
                inputStart.focus().timepicker 'highlightMinute'

            inputDiff.on 'keydown', (ev) ->
                if ev.keyCode is 37 # left
                    inputEnd.focus().timepicker 'highlightMinute'
                if ev.keyCode is 39 # right
                    @$('#input-desc').focus()

        @calendar = new ComboBox
            el: @$ '#calendarcombo'
            small: true
            source: app.calendars.toAutoCompleteSource()

        @calendar.on 'edition-complete', (value) => @model.setCalendar value

        @refresh()


    getTitle: ->
        if @model.isNew()
            title = "#{@type} creation"
        else
            title = "edit #{@type}"

        return t title

    getRenderData: ->
        data =
            model: @model
            dtFormat: @dtFormat
            editionMode: not @model.isNew()
            advancedUrl: @parentView.getUrlHash() + '/' + @model.id
            calendar: @model.attributes.tags?[0] or ''
            allDay: @model.isAllDay()

        return data

    onSetStart: (ev) -> @model.setStart @formatDateTime ev.time.value

    onSetEnd: (ev) -> @model.setEnd @formatDateTime ev.time.value

    onSetDiff: (ev) ->
        diff = parseInt ev.target.value
        @model.setDiff diff

    onSetDesc: (ev) -> @model.set 'description', ev.target.value

    onAdvancedClicked: (event) =>
        if @model.isNew()
            modal = new EventModal
                model: @model
                backurl: window.location.hash
            $('body').append modal.$el
            modal.render()
        else
            window.location.hash += "/#{@model.id}"
        event.preventDefault()
        @selfclose()

    onKeyUp: (event) -> #
        if event.keyCode is 13 or event.which is 13 #ENTER
            # Forces the combobox to blur to save the calendar if it has changed
            @calendar.onBlur()
            @addButton.click()
        else if event.keyCode is 27 # ESC
            @selfclose()
        else
            @addButton.removeClass 'disabled'

    formatDateTime: (dtStr) ->
        splitted = dtStr.match /([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/
        if splitted and splitted[0]
            setObj =
                hour: splitted[1]
                minute: splitted[2]
            return setObj

    onRemoveClicked: ->
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        if confirm t('are you sure')
            @model.destroy
                wait: true
                error: ->
                    alert t('server error occured')
                complete: =>
                    @removeButton.spin()
                    @removeButton.css 'width', '14px'
                    @selfclose()
        else @removeButton.spin()


    onAddClicked: ->
        return if @$('.btn.add').hasClass 'disabled'
        @addButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addButton.spin 'small'
        errors = @model.validate @model.attributes
        if errors
            @addButton.html @getButtonText()
            @addButton.children().show()

            @addButton.spin()
            @$('.alert').remove()
            @$('input').css 'border-color', ''
            @handleError err for err in errors

        else #no errors.
            @model.save {},
                wait: true
                success: =>
                    @calendar.save()
                    collection = app['events']
                    collection.add @model
                error: ->
                    alert 'server error occured'
                complete: =>
                    @addButton.spin false
                    @addButton.html @getButtonText()
                    @addButton.children().show()
                    @selfclose()


    selfclose: ->
        # Revert if not just saved with addButton.
        if @model.isNew()
            super()
        else
            @model.fetch complete: super

    close: ->
        # we don't reuse @selfclose because both are doing mostly the same thing
        # but are a little bit different.
        # Revert if not just saved with addButton.
        if @model.isNew()
            super()
        else
            @model.fetch complete: super


    refresh: ->
        @$('#input-start').val @model.getStartDateObject().format(@dtFormat)
        @$('#input-end').val @model.getEndDateObject().format(@dtFormat)
        @$('#input-diff').val @model.getDiff()

    handleError: (error) ->
        switch error.field
            when 'description'
                guiltyFields = '#input-desc'

            when 'startdate'
                guiltyFields = '#input-start'

            when 'enddate'
                guiltyFields = '#input-end'

            when 'triggdate'
                guiltyFields = '#input-time'

            when 'date'
                guiltyFields = '#input-start, #input-end'

        @$(guiltyFields).css('border-color', 'red')
        @$(guiltyFields).focus()
        alertMsg = $('<div class="alert"></div>').text(t(error.value))
        @$('.popover-content').before alertMsg

    getButtonText: -> if @model.isNew() then t('create') else t('edit')

