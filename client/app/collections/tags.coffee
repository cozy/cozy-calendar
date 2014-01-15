module.exports = class Tags extends Backbone.Collection

    url: 'tags'
    model: class Tag extends Backbone.Model
        constructor: (tag) -> super value: tag
        toString: -> @get 'value'