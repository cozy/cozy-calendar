View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmPopOver = require './alarm_popover'
AlarmsListView = require '../views/alarms_list_view'
Alarm = require '../models/alarm'
helpers = require '../helpers'

Alarm = require '../models/alarm'
AlarmList = require './import_alarm_list'
alarmFormSmallTemplate = require('./templates/alarm_form_small')


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
            success: (valarms) =>
                console.log valarms
                for valarm in valarms
                    alarm = new Alarm valarm
                    console.log alarm
                    console.log @alarmList.$collectionEl
                    @alarmList.collection.add alarm

            error: ->
                alert 'error'
