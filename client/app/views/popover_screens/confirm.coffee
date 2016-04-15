PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class ConfirmClosePopoverScreen extends PopoverScreenView

    screenTitle: t('are you sure')

    # Override title template.
    templateTitle: require 'views/templates/popover_screens/confirm_title'
    templateContent: require 'views/templates/popover_screens/confirm'

    events:
        'click .answer-no': -> @switchToScreen(@popover.previousScreen)
        'click .answer-yes': 'onYes'
        'change .dontaskagain': 'onCheckboxChange'

    onYes: ->
        @popover.callbackIfYes()

    onCheckboxChange: ->
        dontaskagain = $('.dontaskagain').is(':checked')
        localStorage.dontConfirmCalendarPopover = dontaskagain
