module.exports = class Tag extends Backbone.Model
    urlRoot: 'tags'

    # idAttribute: 'name'
    defaults:
        visible: true


    toString: -> @get 'name'
