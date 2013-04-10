View = require '../lib/view'

module.exports = class AddAlarmFormView extends View

    tagName: 'div'
    className: 'control-group'

    render: (options) ->

        formattedDateObject = @getFormattedDateObject(options.defaultDateObject)

        super
            id: @getIndex()
            actions: options.actions
            defaultAction: options.defaultAction
            defaultDate: formattedDateObject.date
            defaultTime: formattedDateObject.time

    template: () ->
        require './templates/addreminder_alarm_form'

    getIndex: ->
        return @id.replace 'alarm-', ''

    getFormattedDateObject: (dateObject) ->

        if dateObject.month <= 9 and "#{dateObject.month}".length is 1
            dateObject.month = "0#{dateObject.month}"

        if dateObject.day <= 9 and "#{dateObject.day}".length is 1
            dateObject.day = "0#{dateObject.day}"

        if dateObject.hour <= 9 and "#{dateObject.hour}".length is 1
            dateObject.hour = "0#{dateObject.hour}"

        if dateObject.minute <= 9 and "#{dateObject.minute}".length is 1
            dateObject.minute = "0#{dateObject.minute}"

        return formattedDateObject =
            date: "#{dateObject.year}-#{dateObject.month}-#{dateObject.day}"
            time: "#{dateObject.hour}:#{dateObject.minute}"

