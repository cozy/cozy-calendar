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
        _.extend {type: 'event'}, @model.attributes,
            editionMode: not @model.isNew()
            start: @model.getFormattedStartDate('{HH}:{mm}')
            end: @getEndDateWithDiff()

    getEndDateWithDiff: ->
        endDate = @model.getEndDateObject()
        startDate = @model.getStartDateObject()
        unless @model.isOneDay()
            diff = endDate - @model.getStartDateObject()
            diff = Math.round(diff / 1000 / 3600 / 24)

        time = @model.getFormattedEndDate('{HH}:{mm}')
        if diff then "#{time}+#{diff}" else time

    getModelAttributes: ->
        startDate = @formatDate @date, $('.popover #input-start').val()
        endDate = @formatDate @date, $('.popover #input-end').val()
        # specifiedDay =  #.split('+')

        # Store new event
        data =
            start: startDate.format Event.dateFormat, 'en-en'
            end: endDate.format Event.dateFormat, 'en-en'
            # diff: parseInt(specifiedDay[1])
            place: $('.popover #input-place').val()
            description: $('.popover #input-desc').val()

        return data

