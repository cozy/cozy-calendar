EventPopoverScreenView = require 'views/calendar_popover_screen_event'
random = require 'lib/random'

module.exports = class GuestPopoverScreen extends EventPopoverScreenView

    screenTitle: ''
    templateContent: require 'views/templates/popover_screens/guests'

    templateGuestRow: require 'views/templates/popover_screens/guest_row'

    events:
        "click .add-new-guest"          : "onNewGuest"
        "click .guest-delete"           : "onRemoveGuest"
        "click .guest-share-with-cozy"  : "onShareWithCozy"
        "click .guest-share-with-email" : "onShareWithEmail"
        'keyup input[name="guest-name"]': "onKeyup"

    getRenderData: ->

        # Override the screen title based on the model's value.
        guests = @formModel.get('attendees') or []
        numGuests = guests.length
        if numGuests > 0
            @screenTitle = t('screen guest title', smart_count: numGuests)
        else
            @screenTitle = t('screen guest title empty')

        return _.extend super(),
            guests: @formModel.get('attendes') or []


    afterRender: ->
        $guests = @$ '.guests'

        # Remove the existing elements of the list.
        $guests.empty()

        # Create a list item for each alert.
        guests = @formModel.get('attendees') or []
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
        guests = @formModel.get('attendees') or []
        guests.splice index, 1
        @formModel.set 'attendees', guests

        # Inefficient way to refresh the list, but it's okay since it will never
        # be a big list.
        @render()


    # Sharing an invitation directly between Cozy instances.
    onShareWithCozy: (event) ->
        # Get the guest
        index = @$(event.target).parents('li').attr 'data-index'

        # Get the contact information of the guest
        guests = @formModel.get('attendees') or []

        # Same as for the function onNewGuest: the clone is required for the
        # view to be refreshed
        guests = _.clone guests
        guest  = guests[index]
        # We add the information regarding the cozy: we change the label field
        # so that the user has a visual feedback
        guest.shareWithCozy = true
        guest.label         = "Cozy: " + guest.name

        @formModel.set 'attendees', guests
        # We force the refresh
        @render()


    # If the user want to revert back to sharing the invitation using an email
    # instead of the guest Cozy.
    onShareWithEmail: (event) ->
        # Get the guest
        index = @$(event.target).parents('li').attr 'data-index'

        # Get the contact information of the guest
        guests = @formModel.get('attendees') or []

        # Same as for the function onNewGuest: the clone is required for the
        # view to be refreshed
        guests = _.clone guests
        guest  = guests[index]
        # We add the information regarding the cozy: we change the label field
        # so that the user has a visual feedback
        guest.shareWithCozy = false
        guest.label         = guest.email

        @formModel.set 'attendees', guests
        # We force the refresh
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
            guests = @formModel.get('attendees') or []
            if not _.findWhere(guests, email: email)
                newGuest =
                    key           : random.randomString()
                    status        : 'INVITATION-NOT-SENT'
                    email         : email
                    label         : email
                    contactid     : contactID
                    shareWithCozy : false

                # If guest was "autocompleted" then contactID is not null and we
                # can check if a cozy instance is linked to this contact
                if contactID?
                    contact       = app.contacts.get contactID
                    newGuest.cozy = contact.get 'cozy'
                    newGuest.name = contact.get 'name'

                # Clone the source array, otherwise it's not considered as
                # changed because it changes the model's attributes
                guests = _.clone guests
                guests.push newGuest
                @formModel.set 'attendees', guests

                # Inefficient way to refresh the list, but it's okay since
                # it will never be a big list.
                @render()

        # Reset form field.
        @$('input[name="guest-name"]').val ''
        @$('input[name="guest-name"]').focus()


    onKeyup: (event) ->
        key = event.keyCode
        if key is 13 # enter
            @onNewGuest()

