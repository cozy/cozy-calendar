View = require '../lib/view'
DayProgramView = require './dayprogram_view'

{AlarmCollection} = require '../collections/alarms'
{DayProgramCollection} = require '../collections/dayprograms'
{DayProgram} = require '../models/dayprogram'

module.exports = class RemindersView extends View

    el: '#reminders'

    constructor: (attributes, options) ->

        @appModel = attributes.appModel
        attributes.model = new DayProgramCollection()

        super attributes, options

    initialize: ->
        @listenTo @appModel, "add", @onAdd
        @listenTo @appModel, "remove", @onRemove
        @listenTo @appModel, "move", @onMove
        @listenTo @appModel, "reset", @onReset

        @listenTo @model, 'add', @onAddDayProgram

        @views = {}

    ###
     We map the model persisted in the database to a custom model
     in the application in order to:
       * persist in the iCal format
       * have a proper architecture in the app without being constraint by the
         standard format
    ###
    onAdd: (reminder) ->

        reminder.get('alarms').forEach (alarm) =>

            dayDate =
                year: alarm.getDateObject().year
                month: alarm.getDateObject().month
                day: alarm.getDateObject().day
            dateHash = "#{dayDate.year}#{dayDate.month}#{dayDate.day}"

            dayProgram = @model.findWhere {dateHash: dateHash}
            if not dayProgram?
                dayProgramAlarms = new AlarmCollection()
                @model.add new DayProgram
                                date: dayDate,
                                dateHash: dateHash
                                alarms: dayProgramAlarms
            else
                dayProgramAlarms = dayProgram.get 'alarms'

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

    onRemove: (reminder) ->
        console.log "item removed"

    onMove: (event) =>
        console.log "item moved"

    onReset: (event) =>
        console.log "collection reset"


