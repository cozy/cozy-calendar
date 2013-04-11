helpers = require '../helpers'

class exports.Alarm extends Backbone.Model

    constructor: (attributes, options) ->

        if attributes.reminderID? and attributes.index?
            attributes.id = "#{attributes.reminderID}##{attributes.index}"

        super attributes, options

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

        if not attrs.trigger or not helpers.isICalDateValid(attrs.trigger)
            errors.push
                field: 'trigger'
                value: "The date format is invalid. Must be dd/mm/yyyy."

        if errors.length > 0
            return errors

    getDateObject: ->
        date = helpers.icalToISO8601 @get 'trigger'
        return new XDate(date)

    getPreviousDateObject: ->
        if @previous('trigger')?
            return helpers.icalToISO8601 @previous 'trigger'
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
