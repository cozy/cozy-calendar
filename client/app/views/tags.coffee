BaseView = require 'lib/base_view'
TagsCollection = require 'collections/tags'

module.exports = class TagsView extends BaseView

    initialize: ->
        super
        allTags = new TagsCollection()
        allTags.fetch
            success: =>
                @$el.hide().tagit
                    availableTags: allTags.map (tag) -> tag.toString() or []
                    placeholderText: t 'add tags'
                    afterTagAdded  : @tagAdded
                    afterTagRemoved : @tagRemoved

            # hack to prevent tagit events
            @duringRefresh = false

        return this

    getTags: ->
        @$el.tagit 'assignedTags'

    refresh: =>
        @duringRefresh = true
        @$el.tagit 'removeAll'
        for tag in @model.get('tags')
            @$el.tagit 'createTag', tag
        @duringRefresh = false



