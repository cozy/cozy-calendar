BaseView = require '../lib/base_view'
ComboBox = require 'views/widgets/combobox'
helpers = require '../helpers'
request = require '../lib/request'

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
                source: app.calendars.toAutoCompleteSource()
        , 500


    # When a file is selected by the user, the import preview is generated
    # by the backend and the result is displayed.
    onFileChanged: (event) ->
        file = @uploader[0].files[0]
        return unless file
        form = new FormData()
        form.append "file", file
        @importButton.find('span').html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
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
                if result?.calendar?.name
                    @calendarCombo.setValue result.calendar.name

                if result?.events?
                    @showEventsPreview result.events

            error: (xhr) =>
                try
                    msg = JSON.parse(xhr.responseText).msg
                catch e
                    console.error e
                    console.error xhr.responseText
                unless msg?
                    msg = 'An error occured while importing your calendar.'
                alert msg
                @resetUploader()
                @importButton.spin()
                @importButton.find('span').html t 'select an icalendar file'


    # Show the event preview list. It doesn't display all events at the same
    # time because Firefox cannot handle it and freezes.
    showEventsPreview: (events) ->
        # The ics file may contain events with duplicate ID that won't be added
        # to the collection but will be imported, so we can't rely on eventList
        # length for the total number of events to import
        @eventsCount = events.length
        # Break event to import in smaller lists
        # Reduced the number to 50 because sometime the request was too big
        # and some events not imported
        @eventLists  = helpers.getLists events, 50
        window.eventList = @eventList

        async.eachSeries @eventLists, (eventList, done) =>
            @eventList.collection.add eventList, sort: false
            setTimeout done, 500
        , =>
            @eventList.collection.sort()
            @$(".import-form").fadeOut =>
                @resetUploader()
                @importButton.spin()
                buttonText = t 'select an icalendar file'
                @importButton.find('span').html buttonText
                @$(".confirmation").fadeIn()

            @$(".results").slideDown()


    # When import confirmation is clicked, all events and alarm loaded are
    # saved to the backend and linked with the selected calendar.
    onConfirmImportClicked: ->

        # The user selects the calendar that will be set on all imported events
        # and alarms.
        @targetCalendar = @calendarCombo.value()
        if not @targetCalendar? or @targetCalendar is ''
            @targetCalendar = t('default calendar name')
        @calendarCombo.save()

        # Initialize counter.
        @initCounter()

        # Show loading spinner.
        @confirmButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @confirmButton.spin 'tiny'

        # Save every imported events to the database.
        async.eachSeries @eventLists, @importEvents, (err) =>

            # When import is finished, the import form is reset and the
            # calendar view is displayed.
            alert t 'import finished'
            @$(".confirmation").fadeOut()

            @$(".results").slideUp =>
                @$(".import-form").fadeIn()
                @confirmButton.html t 'confirm import'

                if $('.import-errors').html().length is 0
                    app.router.navigate "calendar", true


    # Create events by sending them all via a single request to the backend.
    importEvents: (events, callback) =>
        for event in events
            event.tags = [@targetCalendar]
            event.id = null
            event.import = true

        request.post "events/bulk", events, (err, result) =>

            if err
                msg = result.msg if result?
                msg ?= t 'import error'
                alert msg

            else
                # When an element is successfully imported, it is added
                # to the current calendar view.
                #app.events.add event for event in result.events

                # Events which was not properly imported are listed.
                for event in result.errors
                    @addImportError event

            @updateCounter events.length
            setTimeout callback, 200


    # Display error that occured while importing an element.
    addImportError: (event) ->
        if $('.import-errors').html().length is 0
            $('.import-errors').html """
            <p>#{t 'import error occured for'}</p>
            """

        $('.import-errors').append(
            require('./templates/import_event')(event)
        )


    # Set import counter to 0.
    initCounter: ->
        @counter = 0

        # Set the progress widget
        $('.import-progress').html """
        <p>#{t 'imported events'}:
            <span class="import-counter">0</span>/#{@eventsCount}</p>
        """

    # Update counter current value.
    updateCounter: (increment) ->
        @counter += increment
        $('.import-counter').html @counter


    # When cancel import is clicked, the widget go back to its initial state.
    onCancelImportClicked: ->
        @$(".confirmation").fadeOut()
        @$(".results").slideUp =>
            @$(".import-form").fadeIn()


    resetUploader: ->
        @uploader.wrap('<form>').parent('form').trigger('reset')
        @uploader.unwrap()
