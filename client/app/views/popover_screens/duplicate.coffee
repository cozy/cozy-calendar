PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class ConfirmDuplicatePopoverScreen extends PopoverScreenView

    screenTitle: t('screen duplicate title')

    # Override title template.
    templateTitle: require 'views/templates/popover_screens/duplicate_title'
    templateContent: require 'views/templates/popover_screens/duplicate'

    events:
        'click .popover-back': (event) -> @onBack(event)
        'click .answer-no': (event) -> @onNo(event)
        'click .answer-yes': (event) -> @onYes(event)

    initialize: (options) ->
        super()

        @duplicateCallback = options.data?.duplicateCallback or
            throw new Error 'No duplicate callback has been set.'

        @cancelCallback = options.data?.cancelCallback or
            throw new Error 'No cancel callback has been set.'

    onYes: (event) ->
        # Avoid triggering click out for another popover
        event.stopPropagation()
        @duplicateCallback()

    onNo: (event) ->
        # Avoid triggering click out for another popover
        event.stopPropagation()
        @cancelCallback()

    onBack: (event) ->
        # Avoid triggering click out for another popover
        event.stopPropagation()
        @cancelCallback()
