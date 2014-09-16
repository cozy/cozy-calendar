PopoverView = require '../lib/popover_view'
RRuleFormView = require 'views/event_modal_rrule'
EventModal = require 'views/event_modal'
ComboBox = require 'views/widgets/combobox'
Toggle = require 'views/toggle'
Alarm = require 'models/alarm'
Event = require 'models/event'

module.exports = class EventPopOver extends PopoverView

    titleTemplate: require('./templates/popover_title')
    template: require('./templates/popover_event')
    dtFormat: "HH:mm"
    popoverWidth: 411
    popoverHeight: 200

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
        'changeTime.timepicker #input-start': 'onSetStart'
        'changeTime.timepicker #input-end': 'onSetEnd'
        'input #input-desc': 'onSetDesc' 



    initialize: (options) ->

        if not @model
            @model = @makeNewModel options

        super options

        @listenTo @model, 'change', @refresh

        @options = options


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

        @refresh()


    getTitle: ->
        title = if @model.isNew() then @type + ' creation'
        else 'edit ' + @type
        t(title)

   

    getRenderData: ->
        data =
            model: @model
            dtFormat: @dtFormat
            editionMode: not @model.isNew()

            advancedUrl: @parentView.getUrlHash() + '/' + @model.id

            calendar: @model.attributes.tags?[0] or ''

        return data
        # return _.extend data, @model.attributes
        

    onSetStart: (ev) -> @model.setStart @formatDateTime ev.time.value
    onSetEnd: (ev) -> @model.setEnd @formatDateTime ev.time.value
    onSetDesc: (ev) -> @model.set('description', ev.target.value)

    # onInputs: (ev) ->
    #     @model.set('description', @$('#input-desc').val())
    #     @model.plac
    #     place: @$('#input-place').val()
    #         description: 

    #     data.tags = [@calendar.value()]



    makeNewModel: (options) ->
        return new Event
            start: options.start.toISOString()
            end: options.end.toISOString()
            description: ''
            place: ''

    onTabClicked: (event) ->
        @parentView.showPopover
            type: 'alarm' #if @type is 'event' then 'alarm' else 'event'
            target: @options.target
            start:  @options.start
            end:    @options.end

    onAdvancedClicked: (event) =>
        if @model.isNew()
            # @model.set @getModelAttributes()
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

    formatDateTime: (dtStr) ->
        splitted = dtStr.match /([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/
        # splitted = dtStr.match /([0-9]{1,2}):([0-9]{2})/
        if splitted and splitted[0]
            # [all, hours, minutes, diff] = splitted
            setObj = 
                hour: splitted[1]
                minute: splitted[2]
            return setObj

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
        # @addButton.children().hide()
        @addButton.spin 'small'
        errors = @model.validate(@model.attributes)
        if errors
            @addButton.html @getButtonText()
            @addButton.children().show()

            @addButton.spin()
            @$('.alert').remove()
            @$('input').css('border-color', '')
            @handleError(err) for err in errors

        else #no errors.
            @model.save {},
                wait: true
                success: =>
                    collection = app['events']
                    collection.add @model
                error: =>
                    alert 'server error occured'
                complete: =>
                    @addButton.spin false
                    @addButton.html @getButtonText()
                    @addButton.children().show()
                    @selfclose()
            
        
    selfclose: =>
        # Revert if not just saved with addButton.
        @model.fetch( complete: super )

    updateMapLink: =>
        value = encodeURIComponent @$('#input-place').val()
        btn = @$('#showmap')
        if value
            url = "http://www.openstreetmap.org/search?query=#{value}"
            btn.show().attr 'href', url
        else
            btn.hide()


    refresh: =>
        console.log  "fraicheur de vivre"
        @$('#input-start').val @model.getStartDateObject().format(@dtFormat)
        @$('#input-end').val @model.getEndDateObject().format(@dtFormat)
        # @$('#input-diff').val diff



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

    getButtonText: -> if @model.isNew() then t('create') else t('edit')

