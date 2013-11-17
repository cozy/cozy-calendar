PopOver = require './calendar_popover'
Event = require '../models/event'

module.exports = class EventPopOver extends PopOver


    type: 'event'

    initialize: ->
        super
        @date = @model.getStartDateObject()

    validForm: ->
        @$('#input-start').val() isnt '' and  @$('#input-end').val() isnt '' and
            @$('#input-desc').val() isnt ''

    getRenderData: ->
        _.extend {type: event}, @model.attributes,
            editionMode: not @model.isNew()
            start: @model.getFormattedStartDate('{HH}:{mm}')
            end: @getEndDateWithDiff()

    getEndDateWithDiff: ->
        time = @model.getFormattedEndDate('{HH}:{mm}')
        if diff = @model.get('diff') then "#{time}+#{diff}"
        else time

    getModelAttributes: ->
        dueStartDate = @formatDate $('.popover #input-start').val()
        specifiedDay = $('.popover #input-end').val().split('+')
        if specifiedDay[1]? and @date?
            newDate = @date.advance
                days: specifiedDay[1]
            dueEndDate = Date.create(newDate)
        else
            specifiedDay[1] = 0
            dueEndDate = Date.create(@date)
        dueEndDate = @formatDate specifiedDay[0]

        # Store new event
        data =
            start: dueStartDate.format Event.dateFormat
            end: dueEndDate.format Event.dateFormat
            diff: parseInt(specifiedDay[1])
            place: $('.popover #input-place').val()
            description: $('.popover #input-desc').val()
        return data

