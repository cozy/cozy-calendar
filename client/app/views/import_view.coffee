View = require '../lib/view'
helpers = require '../helpers'

Alarm = require '../models/alarm'
AlarmList = require './import_alarm_list'
Event = require '../models/event'
EventList = require './import_event_list'


module.exports = class ImportView extends View

    el: '#viewContainer'

    events:
        'change #import-file-input': 'onFileChanged'
        'click button': 'onImportClicked'

    initialize: ->

    template: ->
        require('./templates/import_view')

    afterRender: ->
        @alarmList = new AlarmList
        @alarmList.render()
        @eventList = new EventList
        @eventList.render()

    onFileChanged: (event) ->
        file = event.target.files[0]
        @file = file

    onImportClicked: ->
        form = new FormData()
        form.append "file", @file
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
            error: ->
                alert 'error'
