BaseView = require './base_view'
module.exports = class PopoverView extends BaseView

    template: require '../views/templates/popover'

    initialize: (options) ->
        @target = options.target
        @container = options.container
        @parentView = options.parentView

        return @


    selfclose: ->
        @parentView.onPopoverClose?()
        @close()


    close: ->
        @$popover.remove()
        @$popover = null
        @target.data 'popover', undefined
        @remove()


    # Get templates for a given screen.
    getScreen: (screenID = 'default') ->

        screen = @screens?[screenID]
        # A screen must have a title and content attributes.
        if screen?.title and screen?.content
            return screen
        else
            error = """
            Screen '#{screenID}' doesn't exist, or doesn't have a title or a
            content template function.
            """
            throw new Error(error)


    # Switch screen.
    switchToScreen: (screenID) ->

        # Throw if popover has not been rendered yet.
        unless @$popover?
            error = 'Popover must be rendered before switching its screen.'
            throw new Error(error)


        # If the screen is switched back to the default one, call `onLeave` if
        # it exists.
        if screenID is 'default' and @screen?
            @screen.onLeave?.call @

        # Get the screen data.
        @screen = @getScreen screenID

        # Change the DOM with the new screen.
        renderData = @getRenderData()
        @titleElement.html @screen.title(renderData)
        @contentElement.html @screen.content(renderData)

        # Change current screen information
        @screenElement.attr 'data-screen', screenID

        # Execute the screen's callback if it has been defined.
        @screen.afterRender?.call @


    render: ->
        @beforeRender()

        # Only create it if doesn't exist.
        unless @$popover?
            renderData = @getRenderData()
            @screen = @getScreen 'repeat' # 'default'
            popoverWrapper = @template
                title: @screen.title(renderData)
                content: @screen.content(renderData)

            @$popover = $ popoverWrapper
            @titleElement = @$popover.find '.popover-title'
            @contentElement = @$popover.find '.popover-content'
            @screenElement = @$popover.find '.screen-indicator'

            # Reset @el and @$el.
            @setElement @$popover

        # Generic after render must be called before screen-specific.
        @afterRender()

        # Execute the default screen's callback if it has been defined.
        @screen.afterRender?.call @

        # Compute and et popover's position.
        @positionPopover()

        return @


    # Set the popover's position so it doesn't overflow out of the screen.
    positionPopover: ->
        # If it exist, first detach it from the DOM.
        @$popover.detach()
            # Reset positioning.
            .css
                display: 'block'
                top: 'auto'
                left: 'auto'
                left: 'auto'

        # Append the popover to the DOM so it has height/width/offset.
        @$popover.appendTo @container

        # The popover's height must be retrieved when the popover is expanded.
        hiddenElements = @$popover.find '[aria-hidden="true"]'
        hiddenElements.attr 'aria-hidden', false

        # Define everything that will be needed for positionning.
        popoverHeight = @$popover.innerHeight()
        popoverWidth = @$popover.innerWidth()

        # Target is the calendar's cell clicked.
        targetOffset = @target.offset()
        targetWidth = @target.width()
        targetHeight = @target.height()

        # Container is the screen, except the sidebar.
        containerOffset = @container.offset()
        containerHeight = @container.innerHeight()
        containerWidth = @container.innerWidth()

        # `popoverHeight` has been computed based on the expanded popover, but
        # it's collapsed by default.
        hiddenElements.attr 'aria-hidden', true

        # Define default position.
        position =
            top: targetOffset.top
            left: targetOffset.left + 50

        # Check if popover is within viewport's width
        maxXPosition = position.left + targetWidth + popoverWidth
        viewportMaxXPosition = containerOffset.left + containerWidth
        fitRight = maxXPosition < viewportMaxXPosition

        # Check if popover is within viewport's height
        maxYposition = position.top + popoverHeight
        viewportMaxYPosition = containerOffset.top + containerHeight
        fitBottom = maxYposition < viewportMaxYPosition

        # If it's not in viewport's height, position relatively to bottom.
        unless fitBottom
            position.bottom = containerHeight - targetOffset.top
            position.top = 'auto'

        # If it's not in viewport's width, position relatively to right.
        unless fitRight
            position.right = containerWidth - targetOffset.left + targetWidth
            position.left = 'auto'

        # Position the element into the DOM
        @$popover.css position
