View = require '../lib/view'

module.exports = class AddAlarmFormView extends View

    tagName: 'div'
    className: 'control-group'

    render: (defaultAction, actions) ->


        formattedDateObject = @getFormattedDateObject()

        super
            id: @getIndex()
            actions: actions
            defaultAction: defaultAction
            defaultDate: formattedDateObject.date
            defaultTime: formattedDateObject.time

    template: () ->
        require './templates/addreminder_alarm_form'

    getIndex: ->
        return @id.replace 'alarm-', ''

    getFormattedDateObject: () ->
        dateObject = new Date()
        month = dateObject.getMonth() + 1
        month = "0#{month}" if month <= 9
        day = dateObject.getDate();
        day = "0#{day}" if day <= 9

        hours = dateObject.getHours()
        minutes = dateObject.getMinutes()
        hours = "0#{hours}" if hours <= 9
        minutes = "0#{minutes}" if minutes <= 9

        return formattedDateObject =
            date: "#{dateObject.getFullYear()}-#{month}-#{day}"
            time: "#{hours}:#{minutes}"

