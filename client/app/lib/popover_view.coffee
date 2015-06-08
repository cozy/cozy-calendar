BaseView = require './base_view'
module.exports = class PopoverView extends BaseView
# Backbone view which implements Bootstrap popover tool.

    initialize: (options) ->
        @target = options.target
        @container = options.container
        @parentView = options.parentView

        return @

    selfclose: ->
        @parentView.onPopoverClose?()
        @close()

    close: ->
        @popover.remove()
        @popover = null
        @target.data 'popover', undefined
        @remove()


    render: ->
        @beforeRender()

        renderData = @getRenderData()
        template = require '../views/templates/popover'
        popoverWrapper = template
            title: @titleTemplate(renderData)
            content: @template(renderData)

        # Only create it if doesn't exist.
        @popover ?= $ popoverWrapper

        # If it exist, first detach it from the DOM.
        @popover.detach()
            # Reset positioning.
            .css
                display: 'block'
                top: 'auto'
                left: 'auto'
                left: 'auto'

        # Append the popover to the DOM so it has height/width/offset.
        @popover.appendTo @container

        # The popover's height must be retrieved when the popover is expanded.
        @popover.find('.more').show()

        # Define everything that will be needed for positionning.
        popoverHeight = @popover.innerHeight()
        popoverWidth = @popover.innerWidth()

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
        @popover.find('.more').hide()

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
        @popover.css position


        @setElement $("##{@parentView.id} .popover")

        # Manage responsive (for smartphones)
        if $(window).width() <= 500
            $('.popover').css
                top: 0
                left: 0

        @afterRender()
        return @
