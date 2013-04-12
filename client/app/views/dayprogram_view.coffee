View = require '../lib/view'
AlarmView = require './alarm_view'
{AlarmCollection} = require '../collections/alarms'

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
                        id: alarm.id
                        model: alarm

        render = rView.render().$el
        if index is 0
            @$el.find('.alarms').prepend render
        else if index is @model.get('alarms').length - 1
            @$el.find('.alarms').append render
        else
            selector = ".alarms .#{rView.className}:nth-of-type(#{index})"
            @$el.find(selector).before render

        @views[alarm.id] = rView


    onChange: (alarm, options) ->
        @views[alarm.id].model.set(alarm.toJSON())

    onRemove: (alarm, collection, options) ->
        @views[alarm.id].destroy()

        if @model.get('alarms').length is 0
            @model.collection.remove @model

    render: ->
        super
            date: @model.get 'date'

    template: ->
        require './templates/dayprogram'