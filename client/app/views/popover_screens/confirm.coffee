PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class ConfirmClosePopoverScreen extends PopoverScreenView

    screenTitle: t('are you sure')

    # Override title template.
    templateTitle: require 'views/templates/popover_screens/confirm_title'
    templateContent: require 'views/templates/popover_screens/confirm'

    events:
        'click .popover-back': (event) -> @onCancel(event)
        'click .answer-no': (event) -> @onCancel(event)
        'click .answer-yes': (event) -> @onConfirm(event)
        'change .dontaskagain': 'onCheckboxChange'

    initialize: (options) ->
        super()

        @confirmCallback = options.data?.confirmCallback or
            throw new Error 'No confirm callback has been set.'

        @cancelCallback = options.data?.cancelCallback or
            throw new Error 'No cancel callback has been set.'

    onConfirm: (event) ->
        # Avoid triggering click out for another popover
        event.stopPropagation()
        @confirmCallback()

    onCancel: (event) ->
        # Avoid triggering click out for another popover
        event.stopPropagation()
        @cancelCallback()

    onCheckboxChange: ->
        dontaskagain = $('.dontaskagain').is(':checked')
        localStorage.dontConfirmCalendarPopover = dontaskagain
