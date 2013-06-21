View = require '../lib/view'
DayProgramView = require './dayprogram_view'

AlarmCollection = require '../collections/alarms'
Alarm = require '../models/alarm'

module.exports = class AlarmsListView extends View

    el: '#alarms'

    initialize: ->
        @listenTo @model, "add", @onAdd
        @listenTo @model, "change", @onChange
        @listenTo @model, "remove", @onRemove
        @listenTo @model, "reset", @onReset

        @views = {}

        # We don't need a separate DayProgram collection because it is not
        # interesting enough
        @dayPrograms = new Backbone.Collection
        @dayPrograms.comparator = (dayProg1, dayProg2) ->
            d1 = new Date.create dayProg1.get('date')
            d2 = new Date.create dayProg2.get('date')

            if d1.getTime() < d2.getTime()
                return -1
            else if d1.getTime() is d2.getTime()
                return 0
            else
                return 1

        @listenTo @dayPrograms, "remove", @onRemoveDayProgram

    onReset: ->
        @model.forEach (item) =>
            @onAdd item, @model

    onAdd: (alarm, alarms) ->
        dateHash = alarm.getDateHash()
        view = @getSubView dateHash, () => @_getNewSubView(dateHash, alarm)

        view.model.get('alarms').add alarm

    onChange: (alarm) ->

        dateHash = alarm.getDateHash()

        view = @getSubView dateHash, () =>
            @onAdd(alarm)
            return false

        prevDateHash = alarm.getPreviousDateHash()
        if alarm.changedAttributes().trigg? and prevDateHash isnt dateHash
            prevView = @views[prevDateHash]
            prevView.model.get('alarms').remove(alarm)

    onRemoveDayProgram: (dayProgram) ->
        dateHash = dayProgram.get('dateHash')
        @views[dateHash].destroy()
        delete @views[dateHash]

    onRemove: (alarm) ->
        console.log 'remove alarm now'
        dateHash = alarm.getDateHash()
        view = @getSubView dateHash, () => return null

        view.model.get('alarms').remove alarm if view?

    getSubView: (dateHash, callbackIfNotExist) ->

        if @views[dateHash]?
            return @views[dateHash]
        else
            tmp = callbackIfNotExist()
            if tmp instanceof DayProgramView
                return @views[dateHash] = tmp
            else
                return false

    _getNewSubView: (dateHash, alarm) ->
        date = alarm.getDateObject().beginningOfDay()
        @_buildSubView(dateHash, date)
        return @_renderSubView(dateHash)

    _buildSubView: (dateHash, date) ->

        model = new Backbone.Model
                        date: date
                        dateHash: dateHash
                        alarms: new AlarmCollection()
        @dayPrograms.add model

        return @views[dateHash] = new DayProgramView
                                        id: dateHash
                                        model: model

    _renderSubView: (dateHash) ->

        view = @views[dateHash]
        index = index = @dayPrograms.indexOf view.model
        render = view.render().$el
        if index is 0
            @$el.prepend render
        else if index is @dayPrograms.length - 1
            @$el.append render
        else
            selector = ".#{view.className}:nth-of-type(#{index+1})"
            @$el.find(selector).before render

        return view






