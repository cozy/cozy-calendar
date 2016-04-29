# Abstract class that represents a popover screen.
module.exports = class PopoverScreenView extends Backbone.View


    # User-facing screen's title. Only used with the generic templateTitle.
    # Defined in subclasses (if required).
    screenTitle: null


    # Generic template to display the screen's title.
    templateTitle: require 'views/templates/popover_screens/generic_title'


    # Template function that will be used to render this screen.
    # Defined in subclasses.
    templateContent: ->
        console.log 'Warning, no template has been defined for content.'


    constructor: (options, context) ->
        # Retrieve context given by parent popover view
        @context = context

        super(options)

        # Check that mandatory options are defined.
        unless options.titleElement?
            throw new Error('options.titleElement must be defined.')

        unless options.contentElement?
            throw new Error('options.contentElement must be defined.')

        unless options.popover?
            throw new Error('options.popover must be defined.')

        # jQuery elements passed by popover. They are the render targets.
        @titleElement = options.titleElement
        @contentElement = options.contentElement

        # Reference the popover (screen manager) to interact with it: switch
        # screens, close the popover.
        @popover = options.popover

        # Helper to transition to another screen.
        @switchToScreen = @popover.switchToScreen.bind(@popover)


    # Render the screen.
    render: ->
        @_renderTitle()
        @_renderContent()
        @afterRender()


    # Subrender routine. Render the title element.
    _renderTitle: ->
        renderData = @getRenderData()
        @titleElement.html @templateTitle(renderData)


    # Subrender routine. Render the content element.
    _renderContent: ->
        renderData = @getRenderData()
        @contentElement.html @templateContent(renderData)


    # Data to be passed to the template content. Can be overriden.
    # Returns a JS key/value object.
    getRenderData: ->
        return _.extend {}, @model.toJSON(), title: @screenTitle


    # Perform stuff after the element is in the DOM here. Defined in subclasses.
    afterRender: ->


    # Called when the screen is about the be changed. Defined in subclasses.
    onLeaveScreen: ->


    # Called when the screen is no longer visible.
    destroy: ->
        # Set element to null, otherwise `@remove()` will remove the popover
        # element. We just want Backbone to do its magic unbinding.
        @setElement(null)
        @remove()
