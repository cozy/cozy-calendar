View      = require '../lib/view'
AppRouter = require '../routers/app_router'
RemindersView = require './reminders_view'
AddReminderFormView = require './addreminderform_view'
{ReminderCollection} = require '../collections/reminders'
{Reminder} = require '../models/reminder'

{AlarmCollection} = require '../collections/alarms'
{Alarm} = require '../models/alarm'

helpers = require '../helpers'

module.exports = class AppView extends View
    el: 'body.application'

    events:
        "click #add-reminder button.add-reminder": "onAddReminderClicked"
        "click #reminders .alarms p .icon-pencil": "onEditReminderClicked"

    template: ->
        require('./templates/home')

    initialize: ->
        @router = CozyApp.Routers.AppRouter = new AppRouter()

        @reminders = new ReminderCollection()

    afterRender: ->

        @addReminderFormView = new AddReminderFormView()
        @addReminderFormView.render()

        @remindersView = new RemindersView
            appModel: @reminders

        @reminders.fetch
            success: (collection, response, options) ->
                console.log "Fetch: success"
            error: ->
                console.log "Fetch: error"

    onAddReminderClicked: (event, callback) ->

        description = @$('#inputDesc').val()

        if not description? or description is ''
            return

        alarmCollection = new AlarmCollection()
        for alarmView in @addReminderFormView.alarmViews
            id = alarmView.getIndex()
            date = alarmView.$("#inputDate#{id} input").val()
            time = alarmView.$("#inputTime#{id}").val()
            dueDate = helpers.formatDateICal "#{date}:#{time}"
            alarm = new Alarm
                action: alarmView.$("#action#{id}").val()
                trigger: dueDate
                description: "Please, remind: #{description}"
            alarmCollection.add alarm

        if @addReminderFormView.editionMode
            reminder = @addReminderFormView.data
            reminder.save
                description: description
                alarms: alarmCollection.toJSON(),
                    wait: true
                    success: =>
                        @addReminderFormView.resetForm()
                        @addReminderFormView.collapse()
                        console.log "Save: success (attributes updated)"
                    error: ->
                        console.log "Error during reminder save."
        else
            @reminders.create
                description: description
                alarms: alarmCollection.toJSON(),
                    wait: true
                    success: (model, response) =>
                        @addReminderFormView.resetForm()
                        @addReminderFormView.collapse()
                        console.log 'Create reminder: success'
                    error: (error, xhr, options) ->
                        error = JSON.parse xhr.responseText
                        console.log "Create reminder: error: #{error?.msg}"

    onEditReminderClicked: (event) ->
        reminderID = $(event.target).data('reminderid')
        reminder = @reminders.get reminderID
        @addReminderFormView.loadReminderData(reminder)