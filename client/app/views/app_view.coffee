View      = require '../lib/view'
AppRouter = require '../routers/app_router'

AlarmFormView = require './alarmform_view'
AlarmsView = require '../views/alarms_view'

{AlarmCollection} = require '../collections/alarms'
{Alarm} = require '../models/alarm'

SocketListener = require '../lib/socket_listener'

helpers = require '../helpers'

module.exports = class AppView extends View
    el: 'body.application'

    events:
        "click #add-alarm button.add-alarm": "onAddAlarmClicked"
        "click #alarms .alarms p .icon-pencil": "onEditAlarmClicked"
        "click #alarms .alarms p .icon-trash": "onRemoveAlarmClicked"

    template: ->
        require('./templates/home')

    initialize: ->
        @router = CozyApp.Routers.AppRouter = new AppRouter()

    afterRender: ->

        (@alarmFormView = new AlarmFormView()).render()

        @alarms = new AlarmCollection()
        SocketListener.watch @alarms

        @alarmsView = new AlarmsView
            model: @alarms

        @alarms.fetch
            success: (collection, response, options) ->
                console.log "Fetch: success"
            error: ->
                console.log "Fetch: error"

    onAddAlarmClicked: (event, callback) ->
        date = @alarmFormView.dateField.val()
        time = @alarmFormView.timeField.val()
        dueDate = helpers.formatDateISO8601 "#{date}##{time}"
        dueDate = Date.create(dueDate)
        if dueDate.isValid() # validation feedback is made later
            formatter = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00"
            dueDate = dueDate.format formatter
            console.log dueDate
        else
            dueDate = 'undefined'

        data =
            description: @alarmFormView.descriptionField.val()
            action: @alarmFormView.actionField.val()
            trigg: dueDate

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
            alarm = @alarms.create data,
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
        alarm = @alarms.get alarmID
        @alarmFormView.loadAlarmData(alarm)

    onRemoveAlarmClicked: (event) ->
        alarmID = $(event.target).data('alarmid')
        alarm = @alarms.get alarmID
        # TODO: add confirmation
        alarm.destroy
            wait: true
            success: () ->
                console.log "Delete alarm: success"
            error: () ->
                console.log "Delete alarm: error"