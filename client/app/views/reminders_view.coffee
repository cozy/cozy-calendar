View = require '../lib/view'
DayProgramView = require './dayprogram_view'

{AlarmCollection} = require '../collections/alarms'
{Alarm} = require '../models/alarm'
{DayProgramCollection} = require '../collections/dayprograms'
{DayProgram} = require '../models/dayprogram'

module.exports = class RemindersView extends View

    el: '#reminders'

    events:
        "click .alarms p .icon-trash": "onTrashReminderClicked"

    constructor: (options) ->

        @appModel = options.appModel
        options.model = new DayProgramCollection()
        @alarmsToDelete = {}

        super options

    initialize: ->
        @listenTo @appModel, "add", @onAdd
        @listenTo @appModel, "change", @onChange
        @listenTo @appModel, "reset", @onReset

        @listenTo @model, 'add', @onAddDayProgram
        @listenTo @model, 'remove', @onRemoveDayProgram

        @views = {}

    ###
     We map the model persisted in the database to a custom model
     in the application in order to:
       * persist in the iCal format
       * have a proper architecture in the app without being constraint by the
         standard format
    ###
    onAdd: (reminder) ->

        reminder.alarms.forEach (alarm) =>

            dateHash = alarm.getDateHash()

            dayProgram = @model.findWhere {dateHash: dateHash}
            if not dayProgram?
                dayProgramAlarms = new AlarmCollection()
                @model.add new DayProgram
                                date: alarm.getDateObject(),
                                dateHash: dateHash
                                alarms: dayProgramAlarms
            else
                dayProgramAlarms = dayProgram.alarms

            dayProgramAlarms.add alarm

    onAddDayProgram: (dayProgram, programs) ->
        index = programs.indexOf dayProgram

        dpView = new DayProgramView
                    id: dayProgram.get 'dateHash'
                    model: dayProgram

        @views[dpView.id] = dpView
        render = dpView.render().$el
        if index is 0
            @$el.prepend render
        else if index is programs.length - 1
            @$el.append render
        else
            selector = ".#{dpView.className}:nth-of-type(#{index})"
            @$el.find(selector).before render

    onRemoveDayProgram: (dayProgram, collection, options) ->
        delete @views[dayProgram.get('dateHash')] if collection.length is 0


    onChange: (reminder) ->
        #@reRender(); return;

        oldAlarmCollection = new AlarmCollection()
        oldAlarmCollection.reset(reminder.previous('alarms'))
        oldAlarmCollection.forEach (item) =>
            dayProgramModel = @views[item.getDateHash()].model
            dayProgramModel.alarms.remove item
            if dayProgramModel.alarms.length is 0
                @model.remove dayProgramModel

        reminder.alarms.forEach (alarm, index) =>

            dateHash = alarm.getDateHash()
            dayProgram = @model.findWhere {dateHash: dateHash}

            if not dayProgram?
                dayProgramAlarms = new AlarmCollection()
                @model.add new DayProgram
                                date: alarm.getDateObject(),
                                dateHash: dateHash
                                alarms: dayProgramAlarms
            else
                dayProgramAlarms = dayProgram.alarms

            alarmToUpdate = dayProgramAlarms.findWhere({id: alarm.get('id')})
            if alarmToUpdate?
                alarmToUpdate.set alarm.toJSON()
            else
                dayProgramAlarms.add alarm

    # easy way to display the view when model has changed
    reRender: () ->
        @$el.empty()
        @views = {}
        @model.reset()
        @appModel.forEach (reminder) =>
            @onAdd(reminder)

    onTrashReminderClicked: (event) ->
        reminderID = $(event.target).data('reminderid')
        alarmIDs = ($(event.target).data('alarmids')+"").split(',')

        reminder =  @appModel.get(reminderID)
        alarmIDs.forEach (item) =>
            alarmID = "#{reminderID}##{item}"
            reminder.alarms.remove(alarmID)

        reminder.save
            alarms: reminder.alarms.toJSON(),
                wait: true
                success: (model, response) =>
                    console.log 'Save: success (alarm removed)'

    onReset: (event) =>
        console.log "collection reset"

