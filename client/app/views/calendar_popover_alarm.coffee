PopoverView = require '../lib/popover_view'
RRuleFormView = require 'views/event_modal_rrule'
ComboBox = require 'views/widgets/combobox'
Toggle = require 'views/toggle'
Alarm = require 'models/alarm'

module.exports = class AlarmPopOver extends PopoverView

    titleTemplate: require('./templates/popover_title')
    template: require('./templates/popover_alarm')
    dtFormat: "HH:mm"

    events:
        'keyup input': 'onKeyUp'
        'change select': 'onKeyUp'
        'change input': 'onKeyUp'
        'click .add'  : 'onAddClicked'
        'click .remove': 'onRemoveClicked'
        'click #toggle-type': 'onTabClicked'
        'click .close' : 'selfclose'

    initialize: (options) ->
   
        if not @model
            @model = new Alarm
                trigg: options.start.toISOString()
                timezone: 'Europe/Paris'
                description: ''
                action: 'DISPLAY'

        super options

        @options = options


    afterRender: ->
        @addButton = @$('.btn.add').text @getButtonText()
        @removeButton = @$('.remove')
        @removeButton.hide() if @model.isNew()
        @$('input[type="time"]').attr('type', 'text').timepicker
            template: false
            minuteStep: 5
            showMeridian: false
        @$('.focused').focus()

        # if @type is 'alarm'
        #tzInput = @$('#input-timezone')
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

        inputTime = @$('#input-time')
        inputTime.after @actionMail.$el
        inputTime.after @actionNotif.$el
        # tzInput.after @actionMail.$el
        # tzInput.after @actionNotif.$el

        # 20140911 TODO : unused ?
        # if @model.get 'rrule'
        #     @rruleForm = new RRuleFormView model: @model
        #     @rruleForm.render()
        #     @$('#rrule-container').append @rruleForm.$el
        #     @$('#rrule-action').hide()
        #     @$('#rrule-short i.icon-arrow-right').hide()

        @calendar = new ComboBox
            el: @$('#calendarcombo')
            small: true
            source: app.tags.calendars()


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
        data =
            model: @model
            dtFormat: @dtFormat
            editionMode: not @model.isNew()

            calendar: @model.attributes.tags?[0] or ''

        return data
    # getRenderData: ->
    #     data = _.extend type: @type,
    #         @model.attributes,
    #         title: @getTitle()
    #         editionMode: not @model.isNew()
    #         advancedUrl: @parentView.getUrlHash() + '/' + @model.id

    #     data.calendar = data.tags?[0] or ''

 
    #     # else # if alarm
    #     data.time = @model.get('timezoneHour')
    #     # data.time = @model.getDateObject().format '{HH}:{mm}'
    #     ## data.timezones = require('helpers/timezone').timezones

        return data

    onTabClicked: (event) ->
        @parentView.showPopover
            type: 'event' #if @type is 'event' then 'alarm' else 'event'
            target: @options.target
            start:  @options.start
            end:    @options.end


    onKeyUp: (event) -> #
        if event.keyCode is 13 or event.which is 13 #ENTER
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

    getModelAttributes: =>
        

        action = if @actionNotif.value and @actionMail.value then 'BOTH'
        else if @actionMail.value then 'EMAIL'
        else 'DISPLAY'

        trigg = @model.getStartDateObject()
        console.log trigg
        for unit, value of @formatDateTime($('#input-time').val())
            trigg.set(unit, value)

        console.log trigg
        data =
            # timezone: @$('#input-timezone').val()
            timezone: window.app.timezone
            trigg: trigg
            # timezoneHour: @$('#input-time').val()
            description: @$('#input-desc').val()
            action: action

        # 20140911 TODO : unused ?

        # if @rruleForm?.hasRRule()
        #     data.rrule = @rruleForm.getRRule().toString()
        # else
        #     data.rrule = ""

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
                collection = app.alarms
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
