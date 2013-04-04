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

    render: ->

        super
            actions: @model.pluck 'action'
            date: @getDataModel().getDateObject()
            description: @getDataModel().get 'description'

    template: ->
        require './templates/reminder'

    getDataModel: ->
        return @model.at(0)