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
            success: ->
                console.log "Fetch: success"
            error: ->
                console.log "Fetch: error"

    onAddReminderClicked: (event, callback) ->

        description = @$('#inputDesc').val()

        if not description? or description is ''
            return

        console.debug "add reminder"
        console.debug @addReminderFormView.alarmViews
        alarmCollection = new AlarmCollection()
        for alarmView in @addReminderFormView.alarmViews
            id = alarmView.getIndex()
            date = alarmView.$("#inputDate#{id}").val()
            time = alarmView.$("#inputTime#{id}").val()
            dueDate = helpers.formatDateICal "#{date}:#{time}"
            console.debug dueDate
            alarm = new Alarm
                action: alarmView.$("#action#{id}").val()
                trigger: dueDate
                description: "Please, remind: #{description}"
            alarmCollection.add alarm

        @addReminderFormView.resetForm()

        @reminders.create
            description: description
            alarms: alarmCollection.toJSON(),
                wait: true
                success: ->
                    console.log 'success'
                error: (error, xhr, options) ->
                    error = JSON.parse xhr.responseText
                    console.log "error: #{error?.msg}"




