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
        'click .close':         'selfclose'

        # Used in all the screens to come back to the main screen.
        'click div.popover-back': -> @switchToScreen(@mainScreen)


    initialize: (options) ->

        # If model does not exist, the popover represents a new event.
        if not @model
            @model = new Event
                start: @momentToString options.start
                end: @momentToString options.end
                description: ''
                place: ''

        # Context passed to all children popover screens
        @context = {}

        # The formModel represents the form's state. It's synchronized with
        # the original model just before the save action.
        # The formModel is passed to popover screens via the context property
        # @See https://github.com/cozy/cozy-calendar/issues/465
        @context.formModel = @model.clone();

        @listenToOnce @context.formModel, 'change', =>
            @modelHasChanged = true

        super options

    momentToString: (m) ->
        if m.hasTime?() is false then m.toISOString().slice(0, 10)
        else m.toISOString()


    onKeyUp: (event) ->
        if event.keyCode is 27 # ESC
            @selfclose()

    displayConfirmIfNeeded: (checkoutChanges, callbackIfYes) ->
        needConfirm = checkoutChanges and @modelHasChanged
        dontConfirm = localStorage.dontConfirmCalendarPopover and
                      localStorage.dontConfirmCalendarPopover isnt "false"
        if needConfirm and not dontConfirm
            @previousScreen = @screenElement.attr 'data-screen'
            @callbackIfYes = callbackIfYes
            @switchToScreen 'confirm'

        else
            callbackIfYes()


    selfclose: (checkoutChanges = true) ->
        @displayConfirmIfNeeded checkoutChanges, =>
            # Revert if not just saved with addButton.
            if @model.isNew()
                super()
            else
                # Flag to checkout or not the un-persisted changes.
                # Useful when the event is actually deleted.
                if checkoutChanges
                    @model.fetch complete: => super(checkoutChanges)
                else
                    super(checkoutChanges)

        # Popover is closed so the extended status must be reset.
        window.popoverExtended = false


    close: (checkoutChanges = true) ->
        # we don't reuse @selfclose because both are doing mostly the same thing
        # but are a little bit different (see parent class).
        # Revert if not just saved with addButton.
        if @model.isNew()
            super()
        else
            # Flag to checkout or not the un-persisted changes. Useful when the
            # event is actually deleted.
            if checkoutChanges
                @model.fetch complete: super
            else
                super()

        # Popover is closed so the extended status must be reset.
        window.popoverExtended = false
