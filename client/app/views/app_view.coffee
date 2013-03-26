View      = require '../lib/view'
AppRouter = require '../routers/app_router'
RemindersView = require './reminders_view'
{ReminderCollection} = require '../collections/reminders'
{Reminder} = require '../models/reminder'

module.exports = class AppView extends View
    el: 'body.application'

    events:
        "click #add-reminder > button": "onAddReminderClicked"

    template: ->
        require('./templates/home')

    initialize: ->
        @router = CozyApp.Routers.AppRouter = new AppRouter()

        @reminders = new ReminderCollection()
        # Testing purpose
        ###@reminders.add [
            {title: "test", url: "testurl1"},
            {title: "test2", url: "testurl2"},
            {title: "test3", url: "testurl3"}
        ]###

    afterRender: ->
        @remindersView = new RemindersView {model: @reminders}
        @remindersView.loadData()
        @remindersView.render()

    onAddReminderClicked: (event) ->

        value = @$el.find('input[name="content"]').val()

        if value?.length > 0
            @remindersView.model.create
                title: value
                url: 'empty',
                    wait: true
                    success: ->
                        console.log 'success'
                    error: (error, xhr, options) ->
                        error = JSON.parse xhr.responseText
                        console.log "error: #{error?.msg}"
        else
            alert "Please fill the form field."




