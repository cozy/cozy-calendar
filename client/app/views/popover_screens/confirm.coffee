PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class ConfirmClosePopoverScreen extends PopoverScreenView

    screenTitle: t('are you sure')

    # Override title template.
    templateTitle: require 'views/templates/popover_screens/confirm_title'
    templateContent: require 'views/templates/popover_screens/confirm'

    events:
        'click .answer-no': -> @onCancel()
        'click .answer-yes': -> @onConfirm()
        'change .dontaskagain': 'onCheckboxChange'

    initialize: (options) ->
        super()

        @confirmCallback = options.data?.confirmCallback or
            throw new Error 'No confirm callback has been set.'

        @cancelCallback = options.data?.cancelCallback or
            throw new Error 'No cancel callback has been set.'

    onConfirm: ->
        @confirmCallback()

    onCancel: ->
        @cancelCallback()

    onCheckboxChange: ->
        dontaskagain = $('.dontaskagain').is(':checked')
        localStorage.dontConfirmCalendarPopover = dontaskagain
