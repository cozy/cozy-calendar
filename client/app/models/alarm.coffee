helpers = require '../helpers'

class exports.Alarm extends Backbone.Model

    constructor: (attributes, options) ->

        if attributes.reminderID? and attributes.index?
            attributes.id = "#{attributes.reminderID}##{attributes.index}"

        super attributes, options

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
