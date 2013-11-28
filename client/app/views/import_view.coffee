BaseView = require '../lib/base_view'
helpers = require '../helpers'

Alarm = require '../models/alarm'
AlarmList = require './import_alarm_list'
Event = require '../models/event'
EventList = require './import_event_list'


module.exports = class ImportView extends BaseView

    id: 'viewContainer'

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
                        alarm = new Alarm valarm
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

    onConfirmImportClicked: ->
        alarms = @alarmList.collection.toArray()
        events = @eventList.collection.toArray()

        finish = =>
            @$(".confirmation").fadeOut()
            @$(".results").slideUp =>
                @$(".import-form").fadeIn()
                @confirmButton.html t 'confirm import'
            @alarmList.collection.reset()
            @eventList.collection.reset()

        saveAlarms = (alarms) ->
            if alarms.length > 0
                alarms.pop().save()
                saveAlarms alarms
            else
                finish()

        saveEvents = (events) ->
            if events.length > 0
                events.pop().save()
                saveEvents events
            else
                saveAlarms alarms

        @confirmButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @confirmButton.spin 'tiny'
        saveEvents events

    onCancelImportClicked: ->
        @$(".confirmation").fadeOut()
        @$(".results").slideUp =>
            @$(".import-form").fadeIn()

    resetUploader: ->
        @uploader.wrap('<form>').parent('form').trigger('reset')
        @uploader.unwrap()
