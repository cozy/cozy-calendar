View      = require '../lib/view'
AlarmFormView = require './alarm_form_view'
AlarmsListView = require '../views/alarms_list_view'

AlarmCollection = require '../collections/alarms'
Alarm = require '../models/alarm'

helpers = require '../helpers'
defaultTimezone = 'timezone'

module.exports = class ListView extends View

    el: '#viewContainer'

    events:
        "click #add-alarm button.add-alarm": "onAddAlarmClicked"
        "click #alarm-list .icon-pencil": "onEditAlarmClicked"
        "click #alarm-list .icon-trash": "onRemoveAlarmClicked"

    template: ->
        require('./templates/listview')

    afterRender: ->
        (@alarmFormView = new AlarmFormView()).render()
        @alarmsListView = new AlarmsListView
           model: @model

    onAddAlarmClicked: (event, callback) ->
        date = @alarmFormView.dateField.val()
        time = @alarmFormView.timeField.val()
        dueDate = helpers.formatDateISO8601 "#{date}##{time}"
        dueDate = Date.create(dueDate)
        if dueDate.isValid() # validation feedback is done later
            dueDate = dueDate.format Alarm.dateFormat
        else
            dueDate = 'undefined'

        data =
            description: @alarmFormView.descriptionField.val()
            action: @alarmFormView.actionField.val()
            trigg: dueDate

        console.log @alarmFormView.timezoneField.val()

        if @alarmFormView.timezoneField.val() isnt defaultTimezone
            data.timezone = @alarmFormView.timezoneField.val()

        if @alarmFormView.editionMode
            alarm = @alarmFormView.data
            alarm.save data,
                    wait: true
                    ignoreMySocketNotification: true #useless ?
                    success: =>
                        @alarmFormView.resetForm()
                        console.log "Save: success (attributes updated)"
                    error: ->
                        console.log "Error during alarm save."
        else
            alarm = @model.create data,
                    ignoreMySocketNotification: true #useless ?
                    wait: true
                    success: (model, response) =>
                        @alarmFormView.resetForm()
                        console.log 'Create alarm: success'
                    error: (error, xhr, options) ->
                        error = JSON.parse xhr.responseText
                        console.log "Create alarm: error: #{error?.msg}"

        if alarm.validationError?.length > 0
            @alarmFormView.displayErrors(alarm.validationError)

    onEditAlarmClicked: (event) ->
        alarmID = $(event.target).data('alarmid')
        alarm = @model.get alarmID
        @alarmFormView.loadAlarmData(alarm)

    onRemoveAlarmClicked: (event) ->
        alarmID = $(event.target).data('alarmid')
        alarm = @model.get alarmID
        # TODO: add confirmation and loading indicator
        alarm.destroy
            wait: true
            success: () ->
                console.log "Delete alarm: success"
            error: () ->
                console.log "Delete alarm: error"
