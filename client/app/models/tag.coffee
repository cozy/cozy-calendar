colorhash = require 'lib/colorhash'

module.exports = class Tag extends Backbone.Model
    urlRoot: 'tags'

    # idAttribute: 'name'
    defaults: 
        visible: false

    # TODO : Buggy !!
    # initialize: (name)->
    #     @set 'name', name
    #     @set 'color', colorhash name



    toString: -> @get 'name'