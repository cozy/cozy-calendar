ViewCollection = require 'lib/view_collection'
ReminderView   = require 'views/event_modal_reminder'
RRuleFormView  = require 'views/event_modal_rrule'
TagsView       = require 'views/tags'
ComboBox       = require 'views/widgets/combobox'
Event          = require 'models/event'
random         = require 'lib/random'
app            = require 'application'
H              = require 'helpers'

module.exports = class EventModal extends ViewCollection

    template: require './templates/event_modal'

    id: 'event-modal'
    className: 'modal fade'
    attributes:
        'data-keyboard': 'false'

    inputDateTimeFormat: 'DD/MM/YYYY H:mm'
    inputDateTimeDTPickerFormat: 'dd/mm/yyyy hh:ii'
    inputDateFormat: 'DD/MM/YYYY'
    inputDateDTPickerFormat: 'dd/mm/yyyy'
    exportDateFormat: 'YYYY-MM-DD-HH-mm'

    collectionEl: '#guests-list'
    itemview: require './event_modal_guest'

    initialize: (options) ->
        guests = @model.get('attendees') or []
        @collection = new Backbone.Collection guests
        @backurl = options.backurl
        super

    events: ->
        'click  #confirm-btn': 'save'
        'click  #cancel-btn': 'close'
        'click  .close': 'close'
        'click #addguest': => @onGuestAdded @$('#addguest-field').val()
        'keydown #basic-description'    : 'resizeDescription'
        'keypress #basic-description'   : 'resizeDescription'
        'click .addreminder': =>
            @addReminder action: 'DISPLAY', trigg: '-PT10M'
        'click #allday' : 'toggleAllDay'

    afterRender: ->
        super
        @addGuestField = @configureGuestTypeahead()

        @startField = @$('#basic-start').attr 'type', 'text'
        @endField = @$('#basic-end').attr 'type', 'text'
        @toggleAllDay()

        @descriptionField = @$('#basic-description')

        @reminders = []
        @model.get('alarms')?.forEach @addReminder

        @rruleForm = new RRuleFormView model: @model
        @rruleForm.render()
        @$('#rrule-container').append @rruleForm.$el

        @tags = new TagsView
            model: @model
            el: @$('#basic-tags')

        @calendar = new ComboBox
            el: @$('#basic-calendar')
            source: app.tags.calendars()

        @$el.modal 'show'
        $(document).on 'keydown', @hideOnEscape
        @$el.on 'hidden', =>
            $(document).off('keydown', @hideOnEscape)
            window.app.router.navigate @backurl or '',
                trigger: false,
                replace: true
            @remove()

        @$('#basic-summary').focus()

    hideOnEscape: (e) =>
        # escape from outside a datetimepicker
        @close() if e.which is 27 and not e.isDefaultPrevented()

    toggleAllDay: =>

        @startField.datetimepicker 'remove'
        @endField.datetimepicker 'remove'

        options =
            language: window.app.locale
            autoclose: true
            pickerPosition: 'bottom-right'

            keyboardNavigation: false


        if @$('#allday').is ':checked'
            dtFormat = @inputDateFormat
            _.extend options,
                format: @inputDateDTPickerFormat
                minView: 2
                viewSelect: 4

        else
            dtFormat = @inputDateTimeFormat
            _.extend options,
                format: @inputDateTimeDTPickerFormat
                viewSelect: 4

        # Model has non-inclusive end-date, but UI has inclusive end-date,
        # which means a difference of one day.
        modelE = @model.getEndDateObject()
        uiE = modelE.add 'day', -1

        uiS = @model.getStartDateObject()
        # Avoid duration 0 events.
        if uiE.isBefore uiS
            uiE.add 'day', 1

        @startField.val uiS.format dtFormat
        @endField.val uiE.format dtFormat

        @startField.datetimepicker options
        @endField.datetimepicker options


    onGuestAdded: (info) =>
        [email, id] = info.split ';'
        return "" unless email
        guests = @model.get('attendees') or []
        if not _.findWhere(guests, email: email)
            guests.push
                key: random.randomString()
                status: 'INVITATION-NOT-SENT'
                email: email
                contactid: id or null
            @model.set 'attendees', guests
            @refreshGuestList()
            @$('#confirm-btn').text t 'save changes and invite guests'

        @addGuestField.val ''
        return ""

    refreshGuestList: =>
        @collection.reset @model.get 'attendees'

    addReminder: (reminderM) =>
        # doesn't shown action "AUDIO" because the app doesn't support it
        if reminderM.action in ['EMAIL', 'DISPLAY', 'BOTH']
            @$('#reminder-explanation').removeClass 'hide'
            reminder = new ReminderView model: reminderM
            @reminders.push reminder
            reminder.render()
            @$('#reminder-container').append reminder.$el

    resizeDescription: =>
        notes = @descriptionField.val()
        rows = loc = 0
        # count occurences of \n in notes
        rows++ while loc = notes.indexOf("\n", loc) + 1
        @descriptionField.prop 'rows', rows + 2

    getRenderData: ->
        data = _.extend {}, @model.toJSON(),
            summary: @model.get 'description'
            description: @model.get 'details'

            allDay: @model.isAllDay()
            exportdate: @model.getStartDateObject().format @exportDateFormat

        f = if @model.isAllDay() then @inputDateFormat else @inputDateTimeFormat

        data.start = @model.getStartDateObject().format f
        data.end = @model.getEndDateObject().format f

        data.calendar = data.tags?[0] or ''
        data.tags = data.tags?[1..] or []

        return data

    save: =>
        data =
            details: @descriptionField.val()
            description: @$('#basic-summary').val()
            place: @$('#basic-place').val()
            tags: [@$('#basic-calendar').val()].concat @tags.getTags()

        data.alarms = @reminders.map (v) -> return v.getModelAttributes()

        data.rrule =
        if @rruleForm.hasRRule()
            rruleStr = @rruleForm.getRRule().toString()

            # Remove DTSTART field
            data.rrule = rruleStr.split ';'
                    .filter (s) -> s.indexOf 'DTSTART' isnt 0
                    .join ';'

        # start and end :
        if @$('#allday').is ':checked'
            dtS = moment.tz @startField.val(), @inputDateFormat,
                    window.app.timezone
            dtE = moment.tz @endField.val(), @inputDateFormat,
                    window.app.timezone
            # Model has non-inclusive end-date, but UI has inclusive end-date,
            # which means a difference of one day.        
            dtE.add 'day', 1
            
            data.start = H.momentToDateString(dtS)
            data.end = H.momentToDateString(dtE)

        else
            dtS = moment.tz @startField.val(), @inputDateTimeFormat,
                    window.app.timezone
            dtE = moment.tz @endField.val(), @inputDateTimeFormat,
                    window.app.timezone

            if @rruleForm.hasRRule()
                # Recurring event, save ambiguous datetime, and the timezone.

                # Reset timezone to the cozy's user one.
                data.timezone = window.app.timezone
                data.start = H.momentToAmbiguousString(dtS)
                data.end = H.momentToAmbiguousString(dtE)
            else
                # Save UTC for punctual event.
                data.start = dtS.toISOString()
                data.end = dtE.toISOString()

        validModel = @model.save data,
            wait: true
            success: =>
                @close()
            error: =>
                alert('server error')
                @close()

        if not validModel
            @$('.alert').remove()
            @$('.control-group').removeClass('error')
            @handleError error for error in @model.validationError

    handleError: (error) =>
        switch error.field
            when 'description'
                guiltyFields = '#basic-summary'

            when 'startdate'
                guiltyFields = '#basic-start'

            when 'enddate'
                guiltyFields = '#basic-end'

            when 'date'
                guiltyFields = '#basic-start, #basic-end'

        @$(guiltyFields).parents('.control-group').addClass('error')
        alertMsg = $('<div class="alert"></div>').text(t(error.value))
        @$('.modal-body').before alertMsg

    configureGuestTypeahead: =>
        @$('#addguest-field').typeahead
            source: app.contacts.asTypeaheadSource()
            matcher: (contact) ->
                old = $.fn.typeahead.Constructor::matcher
                return old.call this, contact.display
            sorter: (contacts) ->
                beginswith = []
                caseSensitive = []
                caseInsensitive = []

                while (contact = contacts.shift())
                    item = contact.display
                    if not item.toLowerCase().indexOf(this.query.toLowerCase())
                        beginswith.push contact
                    else if ~item.indexOf this.query
                        caseSensitive.push contact
                    else caseInsensitive.push contact

                return beginswith.concat caseSensitive, caseInsensitive

            highlighter: (contact) ->
                old = $.fn.typeahead.Constructor::highlighter
                return old.call this, contact.display

            updater: @onGuestAdded

    close: =>
        @$el.modal 'hide'

    remove: =>
        @tags.remove()
        @calendar.remove()
        @startField.data('datetimepicker').remove()
        @endField.data('datetimepicker').remove()
        super
