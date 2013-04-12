helpers = require '../helpers'

class exports.Alarm extends Backbone.Model

    validate: (attrs, options) ->

        errors = []
        if not attrs.action or attrs.action is ""
            errors.push
                field: 'action'
                value: "An action must be set."

        allowedActions = ['DISPLAY', 'EMAIL']
        if allowedActions.indexOf(attrs.action) is -1
            errors.push
                field: 'action'
                value: "The action must be in #{allowedActions}."

        if not attrs.trigg or not helpers.isICalDateValid(attrs.trigg)
            errors.push
                field: 'trigg'
                value: "The date format is invalid. Must be dd/mm/yyyy."

        if errors.length > 0
            return errors

    getDateObject: ->
        return new XDate(helpers.icalToISO8601 @get('trigg'))

    getFormattedDate: (format) ->
        return @getDateObject().toString format

    getPreviousDateObject: ->
        if @previous('trigg')?
            return new XDate(helpers.icalToISO8601 @previous('trigg'))
        else return false

    getDateHash: (date) ->
        date = @getDateObject() unless date?
        return date.toString 'yyyyMMdd'

    getPreviousDateHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getDateHash(previousDateObject)
        else return false

    getTimeHash: (date) ->
        date = @getDateObject() unless date?
        return date.toString 'yyyyMMddHHmm'

    getPreviousTimeHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getTimeHash(previousDateObject)
        else return false
