PopoverScreenView = require 'lib/popover_screen_view'

# Export the formModel property for all Event Popover Screens
module.exports = class EventPopoverScreenView extends PopoverScreenView

    initialize: ->
        super()
        @formModel = @context.formModel


    getRenderData: ->
        _.extend super(), readOnly: @context.readOnly
