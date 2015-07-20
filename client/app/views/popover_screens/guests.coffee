PopoverScreenView = require 'lib/popover_screen_view'
random = require 'lib/random'

module.exports = class GuestPopoverScreen extends PopoverScreenView

    screenTitle: t('screen guest title')
    templateContent: require 'views/templates/popover_screens/guests'

    templateGuestRow: require 'views/templates/popover_screens/guest_row'

    events:
        "click .add-new-guest": "onNewGuest"
        "click .guest-delete": "onRemoveGuest"
        'keyup input[name="guest-name"]': "onKeyup"


    getRenderData: ->
        return _.extend super(),
            guests: @model.get('attendes') or []


    afterRender: ->
        $guests = @$ '.guests'

        # Remove the existing elements of the list.
        $guests.empty()

        # Create a list item for each alert.
        guests = @model.get('attendees') or []
        for guest, index in guests
            options = _.extend guest, {index}
            row = @templateGuestRow guest
            $guests.append row


    onRemoveGuest: (event) ->
        # Get which guest to remove.
        index = @$(event.target).parents('li').attr 'data-index'

        # Remove the guest.
        guests = @model.get('attendees') or []
        guests.splice index, 1
        @model.set 'attendees', guests

        # Inefficient way to refresh the list, but it's okay since it will never
        # be a big list.
        @afterRender()


    onNewGuest: ->
        email = @$('input[name="guest-name"]').val()
        guests = @model.get('attendees') or []
        if not _.findWhere(guests, email: email)
            # Clone the source array, otherwise it's not considered as
            # changed because it changes the model's attributes
            guests = _.clone guests
            guests.push
                key: random.randomString()
                status: 'INVITATION-NOT-SENT'
                email: email
                contactid: null #id or null
            @model.set 'attendees', guests

            # Inefficient way to refresh the list, but it's okay since it will
            # never be a big list.
            @afterRender()

            # Reset form field.
            @$('input[name="guest-name"]').val ''
            @$('input[name="guest-name"]').focus()


    onKeyup: (event) ->
        key = event.keyCode
        if key is 13 # enter
            @onNewGuest()

