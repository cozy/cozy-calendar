BaseView = require '../lib/base_view'
ComboBox = require 'views/widgets/combobox'
helpers = require '../helpers'

Event = require '../models/event'
EventList = require './import_event_list'


module.exports = class ImportView extends BaseView

    id: 'view-container'

    events:
        'change #import-file-input': 'onFileChanged'
        'click button#confirm-import-button': 'onConfirmImportClicked'
        'click button#cancel-import-button': 'onCancelImportClicked'

    template: require('./templates/import_view')

    afterRender: ->
        @$(".confirmation").hide()
        @$(".results").hide()
        @eventList = new EventList el: @$ "#import-event-list"
        @eventList.render()
        @uploader = @$ '#import-file-input'
        @importButton = @$ '#import-button'
        @confirmButton = @$ 'button#confirm-button'

        # Combo to select in which calendar events will be imported.
        # Autocomplete method cannot be loaded too early. So, we delay its
        # call (the render of the top view occurs after).
        setTimeout =>
            @calendarCombo = new ComboBox
                el: @$('#import-calendar-combo')
                small: true
                source: app.tags.calendars()
        , 500

    onFileChanged: (event) ->
        file = @uploader[0].files[0]
        return unless file
        form = new FormData()
        form.append "file", file
        @importButton.find('span').html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @importButton.spin 'tiny'

        # Empty event collection before importing new lists.
        @eventList.collection.reset()
        @$('.import-progress').html null
        @$('.import-errors').html null

        $.ajax
            url: "import/ical"
            type: "POST"
            data: form
            processData: false
            contentType: false
            success: (result) =>

                if result?.events?
                    for vevent in result.events
                        event = new Event vevent
                        @eventList.collection.add event

                @$(".import-form").fadeOut =>
                    @resetUploader()
                    @importButton.spin()
                    @importButton.find('span').html t 'select an icalendar file'
                    @$(".results").slideDown()
                    @$(".confirmation").fadeIn()

            error: (xhr) =>
                msg = JSON.parse(xhr.responseText).msg
                unless msg?
                    msg = 'An error occured while importing your calendar.'
                alert msg
                @resetUploader()
                @importButton.spin()
                @importButton.find('span').html t 'select an icalendar file'

    # When import confirmation is clicked, all events and alarm loaded are
    # saved to the backend and linked with the selected calendar.
    onConfirmImportClicked: ->

        # The user selects the calendar that will be set on all imported events
        # and alarms.
        calendar = @calendarCombo.value()
        calendar = 'my calendar' if not calendar? or calendar is ''

        # Amount of elements to import.
        total = @eventList.collection.length
        counter = 0

        # Set the progress widget
        $('.import-progress').html """
        <p>#{t 'imported events'}:
            <span class="import-counter">0</span>/#{total}</p>
        """

        updateCounter = ->
            counter++
            $('.import-counter').html counter

        addError = (element, templatePath) ->
            if $('.import-errors').html().length is 0
                $('.import-errors').html """
                <p>#{t 'import error occured for'}:</p>
                """

            $('.import-errors').append(
                require(templatePath)(element.attributes)
            )

        # Show loading spinner.
        @confirmButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @confirmButton.spin 'tiny'

        importEvent = (event, callback) ->
            event.set 'tags', [calendar]
            event.set 'id', null
            event.set 'import', true
            event.save null,
                success: (model) ->
                    # When an element is successfully imported, it is added
                    # to the current calendar view.
                    app.events.add model
                    updateCounter()
                    callback()
                error: ->
                    # When an element failed to import, an error message is
                    # displayed.
                    addEventError event, './templates/import_event'
                    updateCounter()
                    callback()

        # When import is finished, the import form is reset and the
        # calendar view is displayed.
        finalizeImport = (err) =>
            alert t 'import finished'
            @$(".confirmation").fadeOut()
            @$(".results").slideUp =>
                @$(".import-form").fadeIn()
                @confirmButton.html t 'confirm import'
                if $('.import-errors').html().length is 0
                    app.router.navigate "calendar", true

        # Save every imported events to the database.
        events = @eventList.collection.models
        async.eachSeries events, importEvent, finalizeImport

    onCancelImportClicked: ->
        @$(".confirmation").fadeOut()
        @$(".results").slideUp =>
            @$(".import-form").fadeIn()

    resetUploader: ->
        @uploader.wrap('<form>').parent('form').trigger('reset')
        @uploader.unwrap()
