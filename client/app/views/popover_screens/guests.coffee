PopoverScreenView = require 'lib/popover_screen_view'
random = require 'lib/random'

module.exports = class GuestPopoverScreen extends PopoverScreenView

    screenTitle: ''
    templateContent: require 'views/templates/popover_screens/guests'

    templateGuestRow: require 'views/templates/popover_screens/guest_row'

    events:
        "click .add-new-guest": "onNewGuest"
        "click .guest-delete": "onRemoveGuest"
        'keyup input[name="guest-name"]': "onKeyup"


    getRenderData: ->

        # Override the screen title based on the model's value.
        guests = @model.get('attendees') or []
        numGuests = guests.length
        if numGuests > 0
            @screenTitle = t('screen guest title', smart_count: numGuests)
        else
            @screenTitle = t('screen guest title empty')

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

        @configureGuestTypeahead()

        # Focus the form field. Must be done after the typeahead configuration,
        # otherwise bootstrap bugs somehow.
        @$('input[name="guest-name"]').focus()


    # Configure the auto-complete on contacts.
    configureGuestTypeahead: ->
        @$('input[name="guest-name"]').typeahead
            source: app.contacts.asTypeaheadSource()
            matcher: (contact) ->
                old = $.fn.typeahead.Constructor::matcher
                return old.call this, contact.display
            sorter: (contacts) ->
                beginswith = []
                caseSensitive = []
                caseInsensitive = []

                while (contact = contacts.shift())
                    item = contact.display
                    if not item.toLowerCase().indexOf(this.query.toLowerCase())
                        beginswith.push contact
                    else if ~item.indexOf this.query
                        caseSensitive.push contact
                    else caseInsensitive.push contact

                return beginswith.concat caseSensitive, caseInsensitive

            highlighter: (contact) ->
                old = $.fn.typeahead.Constructor::highlighter
                imgPath = if contact.hasPicture
                    "contacts/#{contact.id}.jpg"
                else
                    "img/defaultpicture.png"
                img = '<img width="40px" src="' + imgPath + '" />&nbsp;'
                return img + old.call this, contact.display

            updater: @onNewGuest.bind(@)


    onRemoveGuest: (event) ->
        # Get which guest to remove.
        index = @$(event.target).parents('li').attr 'data-index'

        # Remove the guest.
        guests = @model.get('attendees') or []
        guests.splice index, 1
        @model.set 'attendees', guests

        # Inefficient way to refresh the list, but it's okay since it will never
        # be a big list.
        @render()


    # Handle guest addition. `userInfo` is passed when called by the typeahead.
    onNewGuest: (userInfo = null) ->

        if userInfo? and typeof(userInfo) is "string"
            [email, contactID] = userInfo.split(';')
        else
            email = @$('input[name="guest-name"]').val()
            contactID = null

        # An empty value should not be submitted.
        email = email.trim()
        if email.length > 0
            guests = @model.get('attendees') or []
            if not _.findWhere(guests, email: email)
                # Clone the source array, otherwise it's not considered as
                # changed because it changes the model's attributes
                guests = _.clone guests
                guests.push
                    key: random.randomString()
                    status: 'INVITATION-NOT-SENT'
                    email: email
                    contactid: contactID
                @model.set 'attendees', guests

                # Inefficient way to refresh the list, but it's okay since it will
                # never be a big list.
                @render()

        # Reset form field.
        @$('input[name="guest-name"]').val ''
        @$('input[name="guest-name"]').focus()


    onKeyup: (event) ->
        key = event.keyCode
        if key is 13 # enter
            @onNewGuest()

