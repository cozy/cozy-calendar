Sharing = require '../models/sharing'

module.exports = class SharingCollection extends Backbone.Collection
    model: Sharing

    initialize: ->
        @on 'accepted refused', @onAnsweredSharing


    onAnsweredSharing: (sharing) ->
        @remove sharing
