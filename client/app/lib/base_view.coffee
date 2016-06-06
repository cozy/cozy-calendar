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


    # Define an handler when a click is performed elsewhere in the document
    # Typically, to hide a popup or a popover
    # We pass document as a paramter to be able to easyly test or adapt
    # this method in the future.
    addClickOutListener: (document, callback) ->

        # Handler for clicks that are considered outside the element and should
        # trigger the callback
        documentClickHandler = (event) =>
            # the source event property is set in insideElementClickHandler
            # below.
            clickIsOutside =
                (not event.clickOutSources or @ not in event.clickOutSources)
            if clickIsOutside
                callback()

        document.addEventListener 'click', documentClickHandler

        # Handler for click that are considered inside the element and should
        # not trigger the callback
        insideElementClickHandler = (event) =>
            event.clickOutSources = event.clickOutSources ?= []
            event.clickOutSources.push @

        listenedElements = []

        if @$el
            element = @$el.get(0)
            element.addEventListener 'click', insideElementClickHandler
            listenedElements.push element

        # Return an interface to manage the handling afterwards
        # with methods :
        #   exceptOn to manage exception
        #   ignoreEvent to specify an event that should be ignored
        #   dispose to remove all listeners

        # Specify exceptions that should not be considered as a "click outside"
        exceptOn: (elements) ->
            addClickListener = (element) ->
                if not _.isElement element
                    throw new Error 'Cannot add click listener on non element'
                element.addEventListener 'click', insideElementClickHandler
                listenedElements.push element

            if _.isArray elements
                elements.forEach addClickListener
            else
                addClickListener elements

            # chainable
            return @

        # Specify event which should be ignored as outside click (for example
        # the event responsible for popup or popover opening)
        ignoreEvent: (event) ->
            if event
                insideElementClickHandler event

            # chainable
            return @

        # Clean all listeners
        dispose: ->
            document.removeEventListener 'click', documentClickHandler

            listenedElements.forEach (element) ->
                element.removeEventListener 'click', insideElementClickHandler


    disable: ->
        @$el.attr 'aria-disabled', true


    enable: ($disabler)->
        @$el.removeAttr 'aria-disabled'


    setInvalid: ->
        @$el.attr 'aria-invalid', true


    setValid: ->
        @$el.removeAttr 'aria-invalid'


    setBusy: ->
        @$el.attr 'aria-busy', true


    setNotBusy: ->
        @$el.removeAttr 'aria-busy'
