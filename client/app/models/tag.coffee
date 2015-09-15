module.exports = class Tag extends Backbone.Model
    urlRoot: 'tags'

    # idAttribute: 'name'
    defaults:
        visible: false


    toString: -> @get 'name'
