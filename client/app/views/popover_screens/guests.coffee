EventPopoverScreenView = require 'views/event_popover_screen'
random = require 'lib/random'

module.exports = class GuestPopoverScreen extends EventPopoverScreenView

    screenTitle: ''
    templateContent: require 'views/templates/popover_screens/guests'

    templateGuestRow: require 'views/templates/popover_screens/guest_row'

    events:
        "click .add-new-guest"          : "onNewGuest"
        'keyup input[name="guest-name"]': "onKeyup"

    initialize: (options) ->
        super options
        @listenTo @formModel, 'change:shareID', =>
            @afterRender()

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
            readOnly: @context.readOnly


    afterRender: ->
        $guests = @$ '.guests'

        @formModel.fetchAttendeesStatuses (err, attendees) =>
            @renderAttendees $guests, attendees

    renderAttendees: ($guestElement, attendees) ->
        # Remove the existing elements of the list.
        $guestElement.empty()

        # Create a list item for each alert.
        if attendees
            for guest, index in attendees
                options = _.extend _.clone(guest),
                    index       : index
                    hideShare   : (not guest.cozy?)
                    activeShare : guest.cozy? and guest.isSharedWithCozy
                    hideEmail   : (not guest.email?)
                    activeEmail : guest.email? and (not guest.isSharedWithCozy)
                    readOnly    : @context.readOnly

                $row = $ @templateGuestRow options
                $guestElement.append $row

                if not @context.readOnly
                    @bindGuestActions $row, guest

        if not @context.readOnly

            @configureGuestTypeahead()

            # Focus the form field. Must be done after the typeahead
            # configuration, otherwise bootstrap bugs somehow.
            @$('input[name="guest-name"]').focus()


    # Link directly click action to related guest, avoid using Backbone's
    # default event managing, as we are here in a sort of CollectionView.
    bindGuestActions: ($element, guest) ->
        $element
            .on('click', '.guest-delete', => @onRemoveGuest guest)
            .on('click', '.guest-share-with-cozy', => @onShare guest)
            .on('click', '.guest-share-with-email', => @onEmail guest)


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


    onRemoveGuest: (guest) ->
        # Remove the guest.
        guests = @formModel.get('attendees') or []
        guestIndex = guests.indexOf guest

        if guestIndex is -1
            return

        guests.splice guestIndex, 1

        @formModel.set 'attendees', guests

        # Inefficient way to refresh the list, but it's okay since it will never
        # be a big list.
        @render()


    # Sharing an invitation directly between Cozy instances.
    onShare: (guest) =>
        # Remove duplicate if any and refresh the view.
        @removeIfDuplicate guest, true


    # If the user want to revert back to sharing the invitation using an email
    # instead of the guest Cozy.
    onEmail: (guest) =>
        # Get the guest

        # Remove duplicate if any and refresh the view.
        @removeIfDuplicate guest, false


    # Remove any duplicate: this function looks for a guest who is "identical"
    # to the one the user wants a switch. To be identical means to use the same
    # channel (email or share) to send the event. If a duplicate is found then
    # the guest for whom the user wanted a switch is removed from the guest
    # list.
    #
    # This function also refreshes the view.
    #
    # Parameters:
    #   * guest   : the guest to check for duplicate
    #   * isShare : a boolean to tell if the user wants to switch from email to
    #               share (true) or from share to email (false).
    removeIfDuplicate: (guest, isShare) ->
        guests = @formModel.get('attendees') or []
        # A clone is required in order to refresh the view.
        guestIndex = guests.indexOf guest

        if guestIndex is -1
            return

        guests = _.clone guests
        # We remove the guest from the list to find a possible duplicate.
        guests.splice guestIndex, 1

        # We determine if the switch will create a duplicate.
        if isShare
            test = cozy  : guest.cozy
        else
            test = email : guest.email
        # A duplicate has the parameter `isSharedWithCozy` set to:
        # * true  if the switch is email -> share
        # * false if share -> email
        # => in both cases it matches the value of `isShare`.
        _.extend test, isSharedWithCozy : isShare

        guestBis = _.findWhere guests, test

        # If there is no duplicate.
        if (not guestBis?)
            # If the switch is email -> share then the parameter `isShare` is
            # true hence the label is the guest's cozy; if the switch is share
            # -> email then `isShare` is false and the label is the guest's
            # email.
            guest.label            = if isShare then guest.cozy else guest.email
            guest.isSharedWithCozy = isShare
            # The guest is added back to its original spot.
            guests.splice guestIndex, 0, guest

        @formModel.set 'attendees', guests
        # Force refresh the view.
        @render()


    # Handle guest addition. `userInfo` is passed when called by the typeahead.
    onNewGuest: (userInfo = null) ->

        # Autocomplete was used.
        if userInfo? and typeof(userInfo) is "string"
            [channel, contactID] = userInfo.split(';')
        # Field was entered manually.
        else
            channel   = @$('input[name="guest-name"]').val()
            contactID = null

        # Determine if guest's "channel" of communication is the url of his cozy
        # or his mail address.
        # The regular expression below was found here:
        # http://www.regular-expressions.info/email.html
        emailRegExp =
            /// ^
                (?=[A-Z0-9][A-Z0-9@._%+-]{5,253}$)[A-Z0-9._%+-]{1,64}
                @
                (?:(?=[A-Z0-9-]{1,63}\.)[A-Z0-9]+(?:-[A-Z0-9]+)*\.){1,8}
                [A-Z]{2,63}$
            ///i # the "i" is for case insensitive search

        if emailRegExp.test channel
            email = channel
        else
            cozy  = channel
            cozy  = cozy.trim()

        # Reset form field.
        @$('input[name="guest-name"]').val ''
        @$('input[name="guest-name"]').focus()

        guests = @formModel.get('attendees') or []

        # Look for a duplicate:
        # * another guest with the same email and for whom the event is not
        # shared;
        if email? and (email.length > 0)
            guestBisEmail = _.findWhere guests,
                email            : email
                isSharedWithCozy : false
        # * another guest with the same cozy and for whom the event is shared
        if cozy? and (cozy.length > 0)
            guestBisCozy  = _.findWhere guests,
                cozy             : cozy
                isSharedWithCozy : true

        # If there is no duplicate we can add the guest.
        if (email? and (email.length > 0) and (not guestBisEmail)) or
        (cozy? and (cozy.length > 0) and (not guestBisCozy))
            newGuest =
                key       : random.randomString()
                status    : 'INVITATION-NOT-SENT'
                contactid : contactID

            if contactID?
                contact = app.contacts.get contactID

            _.extend newGuest,
                name             : if contact? then \
                    (contact.get 'name') else null
                cozy             : cozy or
                    (contact and contact.get('cozy')?[0]?.value) or null
                email            : email or
                    (contact and contact.get('emails')?[0]?.value) or null
                label            : email or cozy
                isSharedWithCozy : cozy?

            # Clone the source array, otherwise it's not considered as
            # changed because it changes the model's attributes
            guests = _.clone guests
            guests.push newGuest
            @formModel.set 'attendees', guests

            # Inefficient way to refresh the list, but it's okay since
            # it will never be a big list.
            @render()


    onKeyup: (event) ->
        key = event.keyCode
        if key is 13 # enter
            @onNewGuest()
