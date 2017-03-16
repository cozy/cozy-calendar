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
        duplicate: require 'views/popover_screens/duplicate'


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

        # Listen to attendees, they could be change by a call to event.prepare
        # before a deletion of an event. If so, we have to keep attendees equals
        # to avoid a warning message after delete confirmation.
        @listenTo @model, 'change:attendees', =>
            @context.formModel.set 'attendees', @model.get 'attendees'

        @listenToOnce @context.formModel, 'change', (model, options) =>
            @modelHasChanged = true

    afterRender: ->
        super()
        @setTargetToIgnoreOnCloseEvent()


    # Warning: The Calendar view from full calendar trigger
    # another click event on the far bottom part of a day cell.
    # So, two Mouse event are triggered sometimes, and so we have to ignore
    # click event from the unexpect ed source.
    # here is a calendar cell (td element).
    setTargetToIgnoreOnCloseEvent: =>
        if @isMonthView()
            @ignoreMonthGridOnCloseEvent()
        else # We consider it's week view.
            @ignoreWeekGridOnCloseEvent()
        @context.clickOutListener = @clickOutListener # Save ignore config.

    isMonthView: =>
        return @target.closest('.fc-row').get(0)?

    ignoreMonthGridOnCloseEvent: =>
        @clickOutListener.exceptOn $('.fc-day-grid-container').get(0)

    ignoreWeekGridOnCloseEvent: =>
        @clickOutListener.exceptOn $('.fc-time-grid').get(0)

    onKeyUp: (event) ->
        if event.keyCode is 27 # ESC
            @close()


    confirmClose: (confirmCallback, cancelCallback) =>
        @switchToScreen 'confirm',
            confirmCallback: confirmCallback
            cancelCallback: cancelCallback


    close: (callback) ->
        return if @closing

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
            # avoid bug getting back to duplication confirm screen
            if screen is 'duplicate'
                @switchToScreen 'main'
            else
                @switchToScreen screen

        @confirmClose confirmHandler, cancelHandler
