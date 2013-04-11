View = require '../lib/view'

module.exports = class AddAlarmFormView extends View

    tagName: 'div'
    className: 'control-group'

    render: (options) ->

        super
            id: @getIndex()
            actions: options.actions
            defaultAction: options.defaultAction
            defaultDate: options.defaultDateObject.toString 'dd/MM/yyyy'
            defaultTime: options.defaultDateObject.toString 'HH:mm'

    template: () ->
        require './templates/addreminder_alarm_form'

    afterRender: ->

        @$("#inputDate#{@getIndex()}").datepicker().on 'changeDate', ->
            $(@).datepicker 'hide'

        @$("#inputTime#{@getIndex()}").timepicker
                                            minuteStep: 1
                                            showMeridian: false

    getIndex: ->
        return @id.replace 'alarm-', ''