PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class DetailsPopoverScreen extends PopoverScreenView

    screenTitle: t('screen description title')
    templateContent: require 'views/templates/popover_screens/details'


    afterRender: ->
        # Focus the form field.
        @$('.input-details').focus()


    # Save the value when the screen is left.
    onLeaveScreen: ->
        value = @$('.input-details').val()
        @model.set 'details', value
