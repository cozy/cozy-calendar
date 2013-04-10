helpers = require '../helpers'

class exports.DayProgram extends Backbone.Model

    constructor: (attributes, options) ->

        @alarms = attributes.alarms
        delete attributes.alarms

        super attributes, options

    getStandardDate: () ->
        return new Date helpers.buildStandardDate @get 'date'