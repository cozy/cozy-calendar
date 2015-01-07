BaseView = require './base_view'
module.exports = class PopoverView extends BaseView
# Backbone view which implements Bootstrap popover tool.

    titleTemplate: ->

    initialize: (options) ->
        @target = options.target
        @container = options.container
        @parentView = options.parentView

        return @

    selfclose: ->
        @parentView.onPopoverClose?()
        @close()

    close: ->
        @target.popover 'destroy'
        @target.data 'popover', undefined
        @remove()

    render: ->
        @beforeRender()

        @target.popover(
            selector: true
            trigger: 'manual'
            title: @titleTemplate @getRenderData()
            html: true
            placement: @getDirection
            content: @template @getRenderData()
            container: @container
        )
        .popover 'show'

        @setElement $("##{@parentView.id} .popover")

        # Manage responsive (for smartphones)
        if $(window).width() <= 500
            $('.popover').css
                top: 0
                left: 0

        @afterRender()
        return @



    getDirection: (tip) =>
        # We need to inject the tip to determines its dimensions, then
        # auto-detect position.
        # This causes an unexpected reflow, but we can't do this otherwise for
        # this time. Bootstrap's Hell...
        $tmp = $(tip).clone().appendTo('body')
        popoverWidth = $tmp.innerWidth()
        popoverHeight = $tmp.innerHeight()
        $tmp.remove()

        pos = @target.offset()
        ctnOfs = @container.offset()
        realWidth = pos.left + @target.width() + popoverWidth
        fitRight = realWidth < ctnOfs.left + @container.width()
        fitLeft = pos.left - popoverWidth > ctnOfs.left

        realHeight = pos.top + @target.height() + popoverHeight
        fitBottom = realHeight < ctnOfs.top + @container.height()

        if fitRight
            return 'right'
        else if fitLeft
            return 'left'
        else if fitBottom
            return 'bottom'
        else
            return 'top'

