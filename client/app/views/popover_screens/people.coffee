PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class PeoplePopoverScreen extends PopoverScreenView

    screenTitle: 'Details'
    templateContent: require 'views/templates/popover_screens/details'

    onLeaveScreen: ->
        super()
        value = @$('.input-details').val()
        @model.set 'details', value
