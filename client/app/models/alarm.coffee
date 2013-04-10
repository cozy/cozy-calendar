helpers = require '../helpers'

class exports.Alarm extends Backbone.Model

    constructor: (attributes, options) ->

        if attributes.reminderID? and attributes.index?
            attributes.id = "#{attributes.reminderID}##{attributes.index}"

        super attributes, options

    getDateObject: ->
        return helpers.icalDateToObject(@get 'trigger')

    getPreviousDateObject: ->
        if @previous('trigger')?
            return helpers.icalDateToObject(@previous 'trigger')
        else return false

    getStandardDate: ->
        return new Date helpers.buildStandardDate @getDateObject()

    getDateHash: (date) ->
        date = @getDateObject() unless date?
        return "#{date.year}#{date.month}#{date.day}"

    getPreviousDateHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getDateHash(previousDateObject)
        else return false

    getTimeHash: (date) ->
        date = @getDateObject() unless date?
        return "#{date.year}#{date.month}#{date.day}#{date.hour}#{date.minute}"

    getPreviousTimeHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getTimeHash(previousDateObject)
        else return false
