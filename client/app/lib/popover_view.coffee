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
        #@setElement $('#view-container .popover') 
        @setElement $('#' + @parentView.id + ' .popover')
        
        @afterRender()
        @

    @getDirection: ->
        # TODO : a helper here ?

