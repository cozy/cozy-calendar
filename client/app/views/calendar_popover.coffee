BaseView = require '../lib/base_view'
RRuleFormView = require 'views/event_modal_rrule'
EventModal = require 'views/event_modal'
ComboBox = require 'views/widgets/combobox'
Toggle = require 'views/toggle'
Alarm = require 'models/alarm'
Event = require 'models/event'

module.exports = class PopOver extends BaseView

    template: require('./templates/popover_content')

    events:
        'keyup input': 'onKeyUp'
        'change select': 'onKeyUp'
        'change input': 'onKeyUp'
        'change #input-place': 'updateMapLink'
        'click .add'  : 'onAddClicked'
        'click .advanced-link'  : 'onAdvancedClicked'
        'click .remove': 'onRemoveClicked'
        'click #toggle-type': 'onTabClicked'
        'click .close' : 'selfclose'

    initialize: (options) ->
        if options.type
            @type = options.type
            @model = @makeNewModel options

        else if @model
            @type = if @model instanceof Event then 'event' else 'alarm'

        @target = options.target
        @container = options.container
        @parentView = options.parentView
        @options = options

    selfclose: () ->
        @parentView.onPopoverClose?()
        @close()

    close: () ->
        @target.popover 'destroy'
        @target.data 'popover', undefined
        @remove()

    render: ->
        @target.popover(
            selector: true
            trigger: 'manual'
            title: require('./templates/popover_title') @getRenderData()
            html: true
            placement: @getDirection()
            content: @template @getRenderData()
        ).popover('show')

        # Manage responsive (for smartphones)
        if $(window).width() <= 500
            $('.popover').css 'top', 0
            $('.popover').css 'left', 0

        @setElement $('#view-container .popover')
        @afterRender()

    afterRender: ->
        @addButton = @$('.btn.add').text @getButtonText()
        @removeButton = @$('.remove')
        @removeButton.hide() if @model.isNew()
        @$('input[type="time"]').attr('type', 'text').timepicker
            template: false
            minuteStep: 5
            showMeridian: false
        @$('.focused').focus()

        inputEnd = @$('#input-end')
        inputStart = @$('#input-start')
        inputDiff = @$('#input-diff')
        inputStart.on 'timepicker.next', => inputEnd.focus()
        inputEnd.on 'timepicker.next', => inputDiff.focus()
        inputEnd.on 'timepicker.prev', => inputStart.focus().timepicker 'highlightMinute'
        inputDiff.on 'keydown', (ev) =>
            if ev.keyCode is 37 # left
                inputEnd.focus().timepicker 'highlightMinute'
            if ev.keyCode is 39 # right
                @$('#input-desc').focus()

        # keep the endDate after the startDate
        inputStart.on 'changeTime.timepicker', (ev) =>
            @adjustTimePickers 'start', ev.time.value

        inputEnd.on 'changeTime.timepicker', (ev) =>
            @adjustTimePickers 'end', ev.time.value

        if @type is 'alarm'
            tzInput = @$('#input-timezone')
            @actionMail = new Toggle
                icon: 'envelope'
                label: 'email notification'
                value: @model.get('action') in ['EMAIL', 'BOTH']

            @actionNotif = new Toggle
                icon: 'exclamation-sign'
                label: 'home notification'
                value: @model.get('action') in ['DISPLAY', 'BOTH']

            @actionMail.on 'toggle', (mailIsOn) =>
                @actionNotif.toggle true unless mailIsOn

            @actionNotif.on 'toggle', (notifIsOn) =>
                @actionMail.toggle true unless notifIsOn

            tzInput.after @actionMail.$el
            tzInput.after @actionNotif.$el

        if @model.get 'rrule'
            @rruleForm = new RRuleFormView model: @model
            @rruleForm.render()
            @$('#rrule-container').append @rruleForm.$el
            @$('#rrule-action').hide()
            @$('#rrule-short i.icon-arrow-right').hide()

        @calendar = new ComboBox
            el: @$('#calendarcombo')
            small: true
            source: app.tags.calendars()

        @updateMapLink()


    getTitle: ->
        title = if @model.isNew() then @type + ' creation'
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
            title: @getTitle()
            editionMode: not @model.isNew()
            advancedUrl: @parentView.getUrlHash() + '/' + @model.id

        data.calendar = data.tags?[0] or ''

        if @model instanceof Event
            endDate = @model.getEndDateObject()
            startDate = @model.getStartDateObject()
            unless @model.isOneDay()
                endDateBeginning = endDate.clone().beginningOfDay()
                startDateBeginning = startDate.clone().beginningOfDay()
                diff = endDateBeginning - startDateBeginning
                diff = diff / (1000 * 3600 * 24)
            data.start = startDate.format '{HH}:{mm}'
            data.end = endDate.format '{HH}:{mm}'
            data.start = '10:00' if data.start is '00:00'
            data.end = '18:00' if data.end is '00:00'
            data.diff = diff or 0

        else
            data.time = @model.get 'timezoneHour'
            # data.time = @model.getDateObject().format '{HH}:{mm}'
            data.timezones = require('helpers/timezone').timezones

        return data

    makeNewModel: (options) ->
        options.start ?= '10:00'
        options.end ?= '18:00'
        options.diff ?= 0

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
        @parentView.showPopover
            type: if @type is 'event' then 'alarm' else 'event'
            target: @options.target
            start:  @options.start
            end:    @options.end

    onAdvancedClicked: (event) =>
        if @model.isNew()
            @model.set @getModelAttributes()
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
            @addButton.click()
        else if event.keyCode is 27 # ESC
            @selfclose()
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

            action = if @actionNotif.value and @actionMail.value then 'BOTH'
            else if @actionMail.value then 'EMAIL'
            else 'DISPLAY'

            data =
                timezone: @$('#input-timezone').val()
                timezoneHour: @$('#input-time').val()
                description: @$('#input-desc').val()
                action: action

            if @rruleForm?.hasRRule()
                data.rrule = @rruleForm.getRRule().toString()
            else
                data.rrule = ""

        data.tags = [@calendar.value()]

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
        else @removeButton.spin()

    onAddClicked: () =>
        return if @$('.btn.add').hasClass 'disabled'
        @addButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addButton.spin 'small'
        validModel = @model.save @getModelAttributes(),
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

        if not validModel
            @addButton.html @getButtonText()
            @addButton.spin()
            @$('.alert').remove()
            @$('input').css('border-color', '')
            @handleError(err) for err in @model.validationError



    updateMapLink: =>
        value = encodeURIComponent @$('#input-place').val()
        btn = @$('#showmap')
        if value
            url = "http://www.openstreetmap.org/search?query=#{value}"
            btn.show().attr 'href', url
        else
            btn.hide()

    # @TODO : refactor this
    adjustTimePickers: (changed, newvalue) =>
        return;
        date = @model.getStartDateObject()

        start = @$('#input-start').val()
        end = @$('#input-end').val()
        diff = parseInt @$('#input-diff').val()

        startDate = @formatDate date, start
        endDate = @formatDate date, end + '+' + diff

        if changed is 'start'
            newStart = @formatDate date, newvalue
            newEnd = endDate.clone()
            if newStart.is(newEnd) or newStart.isAfter(newEnd)
                newEnd = newStart.clone().addHours 1

        else if changed is 'end'
            newStart = startDate.clone()
            newEnd = @formatDate date, newvalue + '+' + diff

            if endDate.getHours() is 23 and newEnd.getHours() is 0
                newEnd.addDays 1
            else if endDate.getHours() is 0 and newEnd.getHours() is 23
                newEnd.addDays -1

            if newStart.is(newEnd) or newStart.isAfter(newEnd)
                newStart = newEnd.clone().addHours -1
                if newStart.getHours() is 0
                    newStart.beginningOfDay()

        else if changed is 'diff'
            if newStart.is(newEnd) or newStart.isAfter(newEnd)
                newEnd = newStart.clone().addHours 1

        if newEnd.short() is newStart.short()
            diff = 0
        else
            oneday = 1000 * 3600 * 24
            bde = newEnd.clone().beginningOfDay()
            bds = newStart.clone().beginningOfDay()
            diff = Math.round (bde - bds) / oneday

        @$('#input-start').val newStart.format '{HH}:{mm}'
        @$('#input-end').val newEnd.format '{HH}:{mm}'
        @$('#input-diff').val diff

        return true


    handleError: (error) =>
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
