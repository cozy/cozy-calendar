module.exports = class View extends Backbone.View

    template: ->

    initialize: ->

    render: (templateOptions) ->
        @beforeRender()
        render =  @template().call null, templateOptions
        @$el.html render
        @afterRender()

        @

    beforeRender: ->

    afterRender: ->

    destroy: ->
        @undelegateEvents()
        @$el.removeData().unbind()
        @remove()
        Backbone.View::remove.call @
