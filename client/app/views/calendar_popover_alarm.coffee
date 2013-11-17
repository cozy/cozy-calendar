PopOver = require './calendar_popover'
Alarm = require '../models/alarm'

module.exports = class AlarmPopOver extends PopOver

    type: 'alarm'

    initialize: ->
        super
        @date = @model.getDateObject()

    validForm: ->
        @$('#input-desc').val() isnt '' and
        @$('#input-time').val() isnt ''

    getRenderData: ->
        _.extend @model.attributes,
            type: @type
            editionMode: not @model.isNew()
            time: @model.getDateObject().format('{HH}:{mm}')

    getModelAttributes: ->
        time = @formatDate $('.popover #input-time').val()

        return data =
            trigg: time.format Alarm.dateFormat
            description: $('.popover #input-desc').val()
