request = require 'lib/request'


module.exports = class Sharing extends Backbone.Model

    urlRoot: 'sharings'

    accept: (callback) ->
        id = @get 'id'
        request.post 'sharing/accept', @toJSON(), (err, response) =>
            if err
                callback err, null
            else
                callback null, response
                @trigger 'accepted', @

    refuse: (callback) ->
        id = @get 'id'
        request.post 'sharing/refuse', @toJSON(), (err, response) =>
            if err
                callback err, null
            else
                callback null, response
                @trigger 'refused', @
