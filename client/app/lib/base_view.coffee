module.exports = class BaseView extends Backbone.View

    template: ->

    initialize: ->

    getRenderData: ->
        model: @model?.toJSON()

    render: ->
        @beforeRender()
        @$el.html @template(@getRenderData())
        @afterRender()
        @

    beforeRender: ->

    afterRender: ->

    destroy: ->
        @undelegateEvents()
        @$el.removeData().unbind()
        @remove()
        Backbone.View::remove.call @


    # "Snap" the view to the given view if an element with the view ID already
    # exists in it.
    # Do nothing if the element with the given ID does not exist.
    snap: (view) ->
        selector = if @id then "##{@id}" else ".#{@className}"
        view.$(selector).each (index, element) =>
            if element then @setElement element
        @
