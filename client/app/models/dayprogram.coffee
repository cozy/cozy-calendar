helpers = require '../helpers'

class exports.DayProgram extends Backbone.Model

    getStandardDate: () ->
        return new Date helpers.buildStandardDate @get 'date'