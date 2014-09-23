BaseView = require './base_view'
module.exports = class PopoverView extends BaseView
# Backbone view which implements Bootstrap popover tool.
    
    titleTemplate: ->

    initialize: (options) ->
        # options { 
        #    target: # elem on which attach the popover.
        #    
        # }
        
        @target = options.target
        @container = options.container
        @parentView = options.parentView

    selfclose: () ->
        @parentView.onPopoverClose?()
        @close()

    close: () ->
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
            placement: @getDirection()
            content: @template @getRenderData()
            container: @container
        ).popover('show')

        # Manage responsive (for smartphones)
        if $(window).width() <= 500
            $('.popover').css 'top', 0
            $('.popover').css 'left', 0

        #@setElement $('#view-container .popover') 
        @setElement $('#' + @parentView.id + ' .popover')
        
        @afterRender()
        @



    getDirection: ->
        pos = @target.offset()
        ctnOfs = @container.offset()
        fitRight = pos.left + @target.width() + @popoverWidth < ctnOfs.left + @container.width()
        fitLeft = pos.left - @popoverWidth > ctnOfs.left

        fitBottom = pos.top + @target.height() + @popoverHeight < ctnOfs.top + @container.height()

        if not fitLeft and not fitRight
            if fitBottom then 'bottom' else 'top'
        else if fitRight then 'right'
        else 'left'

