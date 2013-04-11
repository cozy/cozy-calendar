View = require '../lib/view'
helpers = require '../helpers'

###
A reminder can hold mulitple alarm objects. It happens when there is
mulitple alarms at the same day for the same object.
Basically only the "action" would chance (mail, popup, ...) so we want
to display the information in a single block.
###

module.exports = class ReminderView extends View

    tagName: 'div'
    className: 'reminder'

    events:
        'hover': 'onMouseOver'

    initialize:  ->
        @listenTo @model, 'add', @render
        @listenTo @model, 'change', @render
        @listenTo @model, 'remove', @onRemove

    onRemove: ->
        if @model.length is 0
            @destroy()
        else
            @render()

    render: ->

        if @model.length is 0
            return  @
        else

            super
                actions: @model.pluck 'action'
                time: @getDataModel().getDateObject().toString 'HH:mm'
                description: @getDataModel().get 'description'
                reminderID: @getDataModel().get 'reminderID'
                dateHash: @getDataModel().getDateHash()
                alarmIDs: @model.pluck 'index'

    template: ->
        require './templates/reminder'

    getDataModel: ->
        return @model.at(0)

    onMouseOver: (event) ->

        if event.type is 'mouseenter'
            @$('i').css 'display', 'inline-block'
        else
            @$('i').hide()