RealEvent = require '../models/realevent'

module.exports = class RealEventCollection extends Backbone.Collection
    model = RealEvent
    comparator: (re1, re2) ->
        return re1.start.isBefore re2.start
