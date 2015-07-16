PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class DetailsPopoverScreen extends PopoverScreenView

    screenTitle: 'Details'
    templateContent: require 'views/templates/popover_screens/details'

    # Save the value when the screen is left.
    onLeaveScreen: ->
        value = @$('.input-details').val()
        @model.set 'details', value
