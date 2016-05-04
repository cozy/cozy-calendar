EventPopoverScreenView = require 'views/calendar_popover_screen_event'

module.exports = class DetailsPopoverScreen extends EventPopoverScreenView

    screenTitle: t('screen description title')
    templateContent: require 'views/templates/popover_screens/details'


    afterRender: ->
        # Focus the form field.
        @$('.input-details').focus()


    # Save the value when the screen is left.
    onLeaveScreen: ->
        value = @$('.input-details').val()
        @formModel.set 'details', value

    getRenderData: ->
        return details: @formModel.get 'details'
