BaseView = require '../lib/base_view'
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

    onConfirmImportClicked: ->
        counter = @alarmList.collection.length + @eventList.collection.length
        console.log counter, @alarmList.length, @eventList.length

        onFaillure = (model) =>
            console.log "faillure", model.cid, counter
            counter = counter - 1
            alert('some event fail to save');
            finish() if counter is 0

        onSuccess = (model) =>
            console.log "success", model.cid, counter
            switch model.constructor
                when Event then app.events.add model
                when Alarm then app.alarms.add model

            counter = counter - 1
            finish() if counter is 0

        finish = =>
            @$(".confirmation").fadeOut()
            @$(".results").slideUp =>
                @$(".import-form").fadeIn()
                @confirmButton.html t 'confirm import'
            @alarmList.collection.reset()
            @eventList.collection.reset()
            app.router.navigate "calendar", true

        @confirmButton.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        @confirmButton.spin 'tiny'
        @alarmList.collection.each (alarm) ->
            alarm.save null,
                success: onSuccess
                error: onFaillure

        @eventList.collection.each (event) ->
            event.save null,
                success: onSuccess
                error: onFaillure

    onCancelImportClicked: ->
        @$(".confirmation").fadeOut()
        @$(".results").slideUp =>
            @$(".import-form").fadeIn()

    resetUploader: ->
        @uploader.wrap('<form>').parent('form').trigger('reset')
        @uploader.unwrap()
