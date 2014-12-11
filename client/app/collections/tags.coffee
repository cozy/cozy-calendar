Tag = require '../models/tag'
colorhash = require 'lib/colorhash'

module.exports = class TagCollection extends Backbone.Collection

    model: Tag
    url: 'tags'

    # Uniqueness against Tag.name field.
    add: (models, options) ->
        # handle singular or arrays
        if _.isArray models
            models = _.clone models
        else
            models = if models then [models] else []

        models = models.filter (model) =>
            return not @some (collectionModel) ->
                name = if model?.name then model.name else model.get 'name'
                return collectionModel.get('name') is name

        super models, options

    getByName: (name) ->
        return @find (item) ->
            return item.get('name') is name

    # Get existing or newly created tag with specified name.
    getOrCreateByName: (name) ->
        tag = @getByName name
        
        if not tag
            tag = new Tag 
                name: name
                color: colorhash name

        return tag
