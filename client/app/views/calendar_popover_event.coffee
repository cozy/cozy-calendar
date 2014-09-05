PopoverView = require '../lib/popover_view'
RRuleFormView = require 'views/event_modal_rrule'
EventModal = require 'views/event_modal'
ComboBox = require 'views/widgets/combobox'
Toggle = require 'views/toggle'
Alarm = require 'models/alarm'
Event = require 'models/event'

module.exports = class PopOver extends PopoverView

    titleTemplate: require('./templates/popover_title')
    template: require('./templates/popover_event')

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

                # keep the endDate after the startDate

        'changeTime.timepicker #input-start': 'adjustTimePickers'
         # (ev) =>
            # @adjustTimePickers 'start', ev.time.value

        'changeTime.timepicker #input-end': 'adjustTimePickers'
        # , (ev) =>
            # @adjustTimePickers 'end', ev.time.value

    initialize: (options) ->
        super options

        if not @model
            @model = @makeNewModel options


    afterRender: ->
        # @addButton = @$('.btn.add').text @getButtonText()
        @addButton = @$('.btn.add')
        @removeButton = @$('.remove')

        @removeButton.hide() if @model.isNew()
        @$('input[type="time"]').attr('type', 'text').timepicker
            template: false
            minuteStep: 5
            showMeridian: false
        @$('.focused').focus()

        # 20140904 : Put them with backbone events ?
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

        # # keep the endDate after the startDate
        # inputStart.on 'changeTime.timepicker', (ev) =>
        #     @adjustTimePickers 'start', ev.time.value

        # inputEnd.on 'changeTime.timepicker', (ev) =>
        #     @adjustTimePickers 'end', ev.time.value


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


    getRenderData: ->
        data = _.extend type: @type,
            @model.attributes,
            title: @getTitle()
            editionMode: not @model.isNew()
            advancedUrl: @parentView.getUrlHash() + '/' + @model.id

        data.calendar = data.tags?[0] or ''

        endDate = @model.getEndDateObject()
        startDate = @model.getStartDateObject()
        unless @model.isOneDay()
            diff = endDate - startDate
            diff = Math.round(diff / 1000 / 3600 / 24)
        data.start = startDate.format 'HH:mm'
        data.end = endDate.format 'HH:mm'
        data.start = '10:00' if data.start is '00:00'
        data.end = '18:00' if data.end is '00:00'
        data.diff = diff or 0


        return data

    makeNewModel: (options) ->
        new Event
            start: options.start.format Event.dateFormat, 'en-en'
            end: options.end.format Event.dateFormat, 'en-en'
            description: ''
            place: ''



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
        # date = Date.create relativeTo
        date = moment.tz(relativeTo, window.app.timezone)

        # smart detection: set the time if the user input has a time
        splitted = value.match /([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/
        if splitted and splitted[0]
            [all, hours, minutes, diff] = splitted
            # date.set {hours: +hours, minutes: +minutes}
            date.set('hour', +hours)
            date.set('minute', +minutes)
            # date.advance(days: +diff) if diff
            date.add('day', +diff) if diff

        return date

    getModelAttributes: =>
        date = @model.getStartDateObject()
        startDate = @formatDate date, @$('#input-start').val()
        end = @$('#input-end').val() + '+' + @$('#input-diff').val()
        endDate = @formatDate date, end
        data =
            start: startDate.format Event.dateFormat, 'en-en'
            end: endDate.format Event.dateFormat, 'en-en'
            place: @$('#input-place').val()
            description: @$('#input-desc').val()

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
        # @addButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @addButton.children().hide()
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
                # @addButton.html @getButtonText()
                @addButton.children().show()
                @selfclose()

        if not validModel
            # @addButton.html @getButtonText()
            @addButton.children().show()

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
    # adjustTimePickers: (changed, newvalue) =>
    adjustTimePickers: (e) =>
        changed = e.target.id.split("-")[1]
        newvalue = e.time.value
        date = @model.getStartDateObject()

        start = @$('#input-start').val()
        end = @$('#input-end').val()
        diff = parseInt @$('#input-diff').val()

        startDate = @formatDate date, start
        endDate = @formatDate date, end + '+' + diff

        if changed is 'start'
            # Check and put end after start.
            newStart = @formatDate date, newvalue
            newEnd = endDate.clone()
            if newStart >=  newEnd
                newEnd = newStart.clone().add(1, 'hour')

        else if changed is 'end'
            # 
            newStart = startDate.clone()
            newEnd = @formatDate date, newvalue + '+' + diff

            # Add or remove a day if midnight is crossed (from and to 23... ?)
            # # 20140905 : TODO : seems crapy.
            # if endDate.getHours() is 23 and newEnd.getHours() is 0
            #     newEnd.addDays 1
            # else if endDate.getHours() is 0 and newEnd.getHours() is 23
            #     newEnd.addDays -1

            # Check start is before end, and move start.
            if newStart >= newEnd
                newStart = newEnd.clone().add(-1, 'hour')
                # if newStart.getHours() is 0
                #     newStart.beginningOfDay()

        else if changed is 'diff'
            # Check start is before end, and move end.
            if newStart >= newEnd
                newEnd = newStart.clone().add(1, 'hour')

        # if newEnd.short() is newStart.short()
        if newEnd.isSame(newStart, 'day')
            diff = 0
        else
            diff = newEnd.diff(newStart, 'day')
            # oneday = 1000 * 3600 * 24
            # bde = newEnd.clone().beginningOfDay()
            # bds = newStart.clone().beginningOfDay()
            # console.log "HERE", diff, (bde - bds) / oneday
            # diff = Math.round (bde - bds) / oneday

        @$('#input-start').val newStart.format 'HH:mm'
        @$('#input-end').val newEnd.format 'HH:mm'
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


    # getButtonText: -> if @model.isNew() then t('create') else t('edit')
