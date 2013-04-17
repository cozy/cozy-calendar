helpers = require '../helpers'

class exports.Alarm extends Backbone.Model

    urlRoot: 'alarms'

    validate: (attrs, options) ->

        errors = []

        if not attrs.description or attrs.description is ""
            errors.push
                field: 'description'
                value: "A description must be set."

        if not attrs.action or attrs.action is ""
            errors.push
                field: 'action'
                value: "An action must be set."

        allowedActions = ['DISPLAY', 'EMAIL']
        if allowedActions.indexOf(attrs.action) is -1
            errors.push
                field: 'action'
                value: "A valid action must be set."

        if not attrs.trigg or not helpers.isDatePartValid(attrs.trigg)
            errors.push
                field: 'triggdate'
                value: "The date format is invalid. It must be dd/mm/yyyy."

        if not attrs.trigg or not helpers.isTimePartValid(attrs.trigg)
            errors.push
                field: 'triggtime'
                value: "The time format is invalid. It must be hh:mm."

        if errors.length > 0
            return errors

    getDateObject: ->

        return new Date.utc.create(helpers.icalToISO8601 @get('trigg'))

    getFormattedDate: (formatter) ->
        return @getDateObject().format formatter

    getPreviousDateObject: ->
        if @previous('trigg')?
            return new Date.utc.create(helpers.icalToISO8601 @previous('trigg'))
        else return false

    getDateHash: (date) ->
        date = @getDateObject() unless date?
        return date.format '{yyyy}{MM}{dd}'

    getPreviousDateHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getDateHash(previousDateObject)
        else return false

    getTimeHash: (date) ->
        date = @getDateObject() unless date?
        return date.format '{yyyy}{MM}{dd}{HH}{mm}'

    getPreviousTimeHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getTimeHash(previousDateObject)
        else return false
