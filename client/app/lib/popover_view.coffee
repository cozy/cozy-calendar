BaseView = require 'lib/base_view'
module.exports = class PopoverView extends BaseView

    template: require 'views/templates/popover'

    initialize: (options) ->
        @target = options.target
        @container = options.container
        @parentView = options.parentView
        @$tabCells = $ '.fc-day-grid-container'

        return @


    selfclose: (checkoutChanges = true) ->
        @parentView.onPopoverClose?()
        @close(checkoutChanges)


    close: ->
        @$popover.remove()
        @$popover = null
        @target.data 'popover', undefined
        @remove()


    # Get templates for a given screen.
    getScreen: (screenID = 'default') ->
        screen = @screens?[screenID]

        # The requested screen must be defined.
        if screen?
            return screen
        else
            throw new Error("Screen '#{screenID}' is not defined.")


    # Switch screen.
    switchToScreen: (screenID) ->

        # Throw if popover has not been rendered yet.
        unless @$popover?
            error = 'Popover must be rendered before switching its screen.'
            throw new Error(error)

        # If the screen is switched back to the default one, call `onLeave` if
        # it exists.
        if screenID is @mainScreen and @screen?
            @screen.onLeaveScreen()

        # Destroy the previous screen.
        if @screen?
            @screen.destroy()

        # Build the screen object and render it.
        @renderScreen screenID


    # Render a specific screen.
    renderScreen: (screenID) ->
        # Get the screen data.
        ScreenBuilder = @getScreen screenID

        # Build it.
        @screen = new ScreenBuilder
            model: @model
            el: @$popover
            titleElement: @titleElement
            contentElement: @contentElement
            popover: @

        # Render it.
        @screen.render()

        # Change current screen information.
        @screenElement.attr 'data-screen', screenID


    render: ->
        @beforeRender()

        # Only create it if doesn't exist.
        unless @$popover?
            # Empty screen by default, will be populated afterwards.
            popoverWrapper = @template
                title: ''
                content: ''

            # Keep references of the main elements to allow each screen to
            # render themselves.
            @$popover = $ popoverWrapper
            @titleElement = @$popover.find '.popover-title'
            @contentElement = @$popover.find '.popover-content'
            @screenElement = @$popover.find '.screen-indicator'

            # Reset @el and @$el.
            @setElement @$popover

        # Generic after render must be called before screen-specific stuff.
        @afterRender()

        # Render the screen itself.
        @renderScreen(@mainScreen)

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

        # Append the popover to the DOM so it has height/width/offset.
        @$popover.appendTo @container

        # Define everything that will be needed for positionning.
        popoverWidth = @$popover.innerWidth()

        # Container is the screen, except the sidebar.
        containerOffset = @$tabCells.offset()
        containerHeight = @$tabCells.innerHeight()
        containerWidth = @$tabCells.innerWidth()

        # Target is the calendar's cell clicked.
        targetOffset = @target.offset()
        targetWidth = @target.width()
        targetLeftBorder = targetOffset.left - @container.offset().left

        # Margin between the popover and the cell.
        popoverMargin = 15

        # Cell is on the left side
        if targetOffset.left <= (containerWidth / 2)
            left = targetLeftBorder + targetWidth + popoverMargin

        # Cell is on the right side
        else
            left = targetLeftBorder - popoverWidth - popoverMargin


        # Compute the height of one row.
        oneRowHeight = (containerHeight / 6)

        # Cell is on the first two rows.
        if targetOffset.top < oneRowHeight * 2
            top = '10vh'
            bottom = 'auto'
        # Cell is on the 3rd row.
        else if targetOffset.top < oneRowHeight * 3
            top = '20vh'
            bottom = 'auto'
        # Cell is on the 4th row.
        else if targetOffset.top < oneRowHeight * 4
            top = 'auto'
            bottom = '15vh'
        # Cell is on the two last rows.
        else
            top = 'auto'
            bottom = '5vh'

        position = {top, bottom, left}

        # Position the element into the DOM
        @$popover.css position
