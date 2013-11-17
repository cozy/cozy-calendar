View = require '../lib/view'
helpers = require '../helpers'

Alarm = require '../models/alarm'
AlarmList = require './import_alarm_list'
Event = require '../models/event'
EventList = require './import_event_list'


module.exports = class ImportView extends View

    id: 'viewContainer'

    events:
        'change #import-file-input': 'onFileChanged'
        'click button#import-button': 'onImportClicked'
        'click button#confirm-import-button': 'onConfirmImportClicked'
        'click button#cancel-import-button': 'onCancelImportClicked'

    initialize: ->

    template: ->
        require('./templates/import_view')

    afterRender: ->
        @$(".confirmation").hide()
        @$(".results").hide()
        @alarmList = new AlarmList
        @alarmList.render()
        @eventList = new EventList
        @eventList.render()
        @importButton = @$ 'button#import-button'
        @confirmButton = @$ 'button#confirm-button'

    onFileChanged: (event) ->
        file = event.target.files[0]
        @file = file

    onImportClicked: ->
        form = new FormData()
        form.append "file", @file
        @importButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
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
                    @importButton.spin()
                    @importButton.html 'import your calendar'
                    @$(".results").slideDown()
                    @$(".confirmation").fadeIn()

            error: (xhr) =>
                msg = JSON.parse(xhr.responseText).msg
                unless msg?
                    msg = 'An error occured while importing your calendar.'
                alert msg
                @importButton.spin()
                @importButton.html 'import your calendar'

    onConfirmImportClicked: ->
        alarms = @alarmList.collection.toArray()
        events = @eventList.collection.toArray()

        finish = =>
            @$(".confirmation").fadeOut()
            @$(".results").slideUp =>
                @$(".import-form").fadeIn()
                @confirmButton.html 'confirm import'
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
