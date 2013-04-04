helpers = require '../helpers'

class exports.Alarm extends Backbone.Model

    constructor: (attributes, options) ->

        if attributes.reminderID? and attributes.index?
            attributes.id = "#{attributes.reminderID}##{attributes.index}"

        super attributes, options


    getDateObject: () ->
        return helpers.icalDateToObject(@get 'trigger')

    getStandardDate: () ->
        return new Date helpers.buildStandardDate @getDateObject()

    getTimeHash: () ->
        date = @getDateObject()
        return "#{date.year}#{date.month}#{date.day}#{date.hour}#{date.minute}"
