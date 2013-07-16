View = require '../lib/view'
AlarmView = require './alarm_view'
AlarmCollection = require '../collections/alarms'

module.exports = class DayProgramView extends View

    tagName: 'div'
    className: 'dayprogram'

    initialize: ->
        @listenTo @model.get('alarms'), "add", @onAdd
        @listenTo @model.get('alarms'), "change", @onChange
        @listenTo @model.get('alarms'), "remove", @onRemove

        @views = {}

    onAdd: (alarm, alarms) ->

        index = alarms.indexOf alarm

        rView = new AlarmView
                        id: alarm.cid
                        model: alarm

        render = rView.render().$el

        if index is 0
            @$el.find('.alarms').prepend render
        else if index is @model.get('alarms').length - 1
            @$el.find('.alarms').append render
        else
            selector = ".alarms .#{rView.className}:nth-of-type(#{index+1})"
            @$el.find(selector).before render

        @views[alarm.cid] = rView

    onChange: (alarm, options) ->
        @views[alarm.cid].model.set(alarm.toJSON())

        if alarm.changedAttributes().trigg?
            view = @views[alarm.cid]
            oldIndex = @model.get('alarms').indexOf alarm
            @model.get('alarms').sort()
            newIndex = @model.get('alarms').indexOf alarm

            if newIndex isnt oldIndex
                if newIndex is 0
                    @$el.find('.alarms').prepend view.$el
                else if newIndex is @model.get('alarms').length - 1
                    @$el.find('.alarms').append view.$el
                else
                    newIndex++ if newIndex > oldIndex
                    selector = ".alarms .#{view.className}:nth-of-type(#{newIndex+1})"
                    @$el.find(selector).before view.$el

    onRemove: (alarm, collection, options) ->
        @views[alarm.cid].destroy()

        if @model.get('alarms').length is 0
            @model.collection.remove @model

    render: ->
        super
            date: @model.get('date').format "{dd}/{MM}/{yyyy}"

    template: ->
        require './templates/dayprogram'