PopoverView = require 'lib/popover_view'
Event       = require 'models/event'

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
                start: options.start.toISOString()
                end: options.end.toISOString()
                description: ''
                place: ''

        super options


    onKeyUp: (event) ->
        if event.keyCode is 27 # ESC
            @selfclose()


    selfclose: (checkoutChanges = true) ->
        # Revert if not just saved with addButton.
        if @model.isNew()
            super()
        else
            # Flag to checkout or not the un-persisted changes. Useful when the
            # event is actually deleted.
            if checkoutChanges
                @model.fetch complete: -> super(checkoutChanges)
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
