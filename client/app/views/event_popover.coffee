PopoverView = require 'lib/popover_view'
Event       = require 'models/event'
Modal       = require 'lib/modal'

unless window.localStorage
    window.localStorage = {}

module.exports = class EventPopOver extends PopoverView


    # Define the screens. Key is used to switch to screen. Value must be a
    # lib/PopoverScreenView.
    screens:
        main: require 'views/popover_screens/main'
        guests: require 'views/popover_screens/guests'
        details: require 'views/popover_screens/details'
        alert: require 'views/popover_screens/alert'
        repeat: require 'views/popover_screens/repeat'
        delete: require 'views/popover_screens/delete'
        confirm: require 'views/popover_screens/confirm'


    # Key of the screen that will be shown first.
    mainScreen: 'main'


    # Events delegation. Generic popover controls are handled here.
    events:
        'keyup':                'onKeyUp'
        'click .close':         'close'

        # Used in all the screens to come back to the main screen.
        'click div.popover-back': -> @switchToScreen(@mainScreen)


    initialize: (options) ->
        super options

        # Context passed to all children popover screens
        @context = {
            # The formModel represents the form's state. It's synchronized with
            # the original model just before the save action.
            # The formModel is passed to popover screens via the context property
            # @See https://github.com/cozy/cozy-calendar/issues/465
            formModel: @model.clone(),
            readOnly: options.readOnly
        }

        @listenTo @model, 'change:shareID', =>
            @context.formModel.set 'shareID', @model.get 'shareID'

        @listenToOnce @context.formModel, 'change', (model, options) =>
            @modelHasChanged = true

    afterRender: ->
        super()
        # Pretty headache here. The Calendar view from full calendar trigger
        # another click event on the far bottom part of a day cell.
        # So, two Mouse event are triggered sometimes, and so we have to ignore
        # click event from the closest parent div having the class fc-row
        # To remind, @target here is a calendar cell (td element).
        try
            @clickOutListener.exceptOn @target.closest('.fc-row').get(0)
            @context.clickOutListener = @clickOutListener
        catch error
            console.warn error

    momentToString: (m) ->
        if m.hasTime?() is false then m.toISOString().slice(0, 10)
        else m.toISOString()


    onKeyUp: (event) ->
        if event.keyCode is 27 # ESC
            @close()


    confirmClose: (confirmCallback, cancelCallback) =>
        @switchToScreen 'confirm',
            confirmCallback: confirmCallback
            cancelCallback: cancelCallback


    close: (callback) ->
        if @closing
            return

        @closing = true

        formModelDiffers = not _.isEqual @context.formModel.attributes,
                                    @model.attributes
        userIgnoresConfirm = localStorage.dontConfirmCalendarPopover and
                             localStorage.dontConfirmCalendarPopover is 'true'

        needConfirm = formModelDiffers and not userIgnoresConfirm

        return super(callback) if not needConfirm

        confirmHandler = =>
            super(callback)

        screen = @context.screen

        cancelHandler = =>
            @closing = false
            @switchToScreen screen

        @confirmClose confirmHandler, cancelHandler

