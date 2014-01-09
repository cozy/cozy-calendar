ViewCollection = require 'lib/view_collection'
RRuleFormView = require 'views/event_modal_rrule'
Event          = require 'models/event'
random         = require 'lib/random'
app            = require 'application'

module.exports = class EventModal extends ViewCollection

    template: require './templates/event_modal'

    id: 'event-modal'
    className: 'modal fade'

    inputDateTimeFormat: '{dd}/{MM}/{year} {HH}:{mm}'
    inputDateFormat: '{year}-{MM}-{dd}'
    exportDateFormat: '{year}-{MM}-{dd}-{HH}-{mm}'

    collectionEl: '#guests-list'
    itemview: require './event_modal_guest'

    initialize: ->
        guests = @model.get('attendees') or []
        @collection = new Backbone.Collection guests
        super

    events: ->
        'click  #confirm-btn': 'save'
        'click  #cancel-btn': 'close'
        'click  .close': 'close'
        'click #addguest': => @onGuestAdded(@$('#addguest-field').val())
        'keydown #basic-description'    : 'resizeDescription'
        'keypress #basic-description'   : 'resizeDescription'

    afterRender: ->
        super
        @addGuestField = @configureGuestTypeahead()
        @startField = @$('#basic-start').attr('type', 'text')
        @startField.parent().datetimepicker
                format: 'dd/mm/yyyy hh:ii'
                pickerPosition: 'bottom-left'
        @endField = @$('#basic-end').attr('type', 'text')
        @endField.parent().datetimepicker
                format: 'dd/mm/yyyy hh:ii'
                pickerPosition: 'bottom-left'

        @descriptionField = @$('#basic-description')

        @rruleForm = new RRuleFormView model: @model
        @rruleForm.render()
        @$('#rrule-container').append @rruleForm.$el

        @$el.modal 'show'
        @$el.on 'hidden', =>
            window.app.router.navigate "calendar",
                trigger: false,
                replace: true
            @remove()

    onGuestAdded: (info) =>
        [email, id] = info.split ';'
        return "" unless email
        guests = @model.get('attendees') or []
        guests.push
            key: random.randomString()
            status: 'INVITATION-NOT-SENT'
            email: email
            contactid: id or null
        @model.set 'attendees', guests
        @addGuestField.val ''
        @refreshGuestList()
        return ""

    refreshGuestList: =>
        @collection.reset @model.get('attendees')

    resizeDescription: =>
        notes = @descriptionField.val()
        rows = loc = 0
        # count occurences of \n in notes
        rows++ while loc = notes.indexOf("\n", loc) + 1
        @descriptionField.prop 'rows', rows + 2

    getRenderData: ->
        data = _.extend {}, @model.toJSON(),
            summary: @model.get('description')
            description: @model.get('details')
            start: @model.getStartDateObject().format @inputDateTimeFormat
            end: @model.getEndDateObject().format @inputDateTimeFormat
            exportdate: @model.getStartDateObject().format @exportDateFormat

        return data


    save: =>
        data =
            details: @descriptionField.val()
            description: @$('#basic-summary').val()
            place: @$('#basic-place').val()
            start: Date.create(@startField.val(), 'fr')
                .format Event.dateFormat, 'en'
            end: Date.create(@endField.val(), 'fr')
                .format Event.dateFormat, 'en'

        if @rruleForm.isVisible()
            data.rrule = @rruleForm.getRRule().toString()
        else
            data.rrule = ''

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
                    if !item.toLowerCase().indexOf this.query.toLowerCase()
                        beginswith.push contact
                    else if ~item.indexOf this.query then caseSensitive.push contact
                    else caseInsensitive.push contact

                return beginswith.concat caseSensitive, caseInsensitive

            highlighter: (contact) ->
                old = $.fn.typeahead.Constructor::highlighter
                return old.call this, contact.display

            updater: @onGuestAdded

    close: =>
        @$el.modal 'hide'
