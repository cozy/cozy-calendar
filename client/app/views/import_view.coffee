BaseView = require '../lib/base_view'
ComboBox = require 'views/widgets/combobox'
helpers = require '../helpers'

Alarm = require '../models/alarm'
AlarmList = require './import_alarm_list'
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
        @alarmList = new AlarmList el: @$ "#import-alarm-list"
        @alarmList.render()
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
        $.ajax
            url: "import/ical"
            type: "POST"
            data: form
            processData: false
            contentType: false
            success: (result) =>

                if result?.alarms?
                    for valarm in result.alarms
                        alarm = new Alarm valarm, parse: true
                        @alarmList.collection.add alarm

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
        counter = @alarmList.collection.length + @eventList.collection.length

        # Finish function is called when there is no more element to save.
        onFaillure = (model) =>
            counter = counter - 1
            finish() if counter is 0

        # Show loading spinner.
        @confirmButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @confirmButton.spin 'tiny'

        # Save every imported alarms to the database.
        async.eachSeries @alarmList.collection.models, (alarm, callback) ->
            alarm.set 'tags', [calendar]
            alarm.set 'id', null
            alarm.save null,
                success: (model) ->
                    # When an element is successfully imported, it is added to
                    # the current calendar view.
                    app.alarms.add model
                    callback()

                error: ->
                    # When an element failed to import, an error message is
                    # displayed.
                    alert t 'some alarm failed to save'
                    callback()
        , (err) =>
            # Save every imported events to the database.
            async.eachSeries @eventList.collection.models, (event, callback) ->
                event.set 'tags', [calendar]
                event.set 'id', null
                event.save null,
                    success: (model) ->
                        # When an element is successfully imported, it is added
                        # to the current calendar view.
                        app.events.add model
                        callback()
                    error: ->
                        # When an element failed to import, an error message is
                        # displayed.
                        alert t 'some event failed to save'
                        callback()

            , (err) =>
                alert t 'import succeeded'
                # When import is finished, the import form is reset and the
                # calendar view is displayed.
                @$(".confirmation").fadeOut()
                @$(".results").slideUp =>
                    @$(".import-form").fadeIn()
                    @confirmButton.html t 'confirm import'
                @alarmList.collection.reset()
                @eventList.collection.reset()
                app.router.navigate "calendar", true


    onCancelImportClicked: ->
        @$(".confirmation").fadeOut()
        @$(".results").slideUp =>
            @$(".import-form").fadeIn()

    resetUploader: ->
        @uploader.wrap('<form>').parent('form').trigger('reset')
        @uploader.unwrap()
