BaseView = require 'lib/base_view'
request = require 'lib/request'
ImportView = require './import_view'
ComboBox = require './widgets/combobox'

module.exports = class SettingsModals extends BaseView

    id: 'settings-modal'
    className: 'modal fade'
    attributes: 'data-keyboard': false

    template: require('./templates/settings_modal')


    events:
        'keyup': 'hideOnEscape'
        'click a#export': 'exportCalendar'
        'click #show-password': 'showPassword'
        'click #hide-password': 'hidePassword'
        'click .modal-close': 'close'


    getRenderData: ->
        account: @model


    initialize: ->
        @model = window.webDavAccount
        if @model?
            # See https://github.com/cozy/cozy-calendar/issues/549
            legacyToken = @model.password
            @model.token = @model.token or legacyToken

            @model.placeholder = @getPlaceholder @model.token


    afterRender: ->
        @$el.attr 'tabindex', '0'

        @calendar = new ComboBox
            el: @$('#export-calendar')
            source: app.calendars.toAutoCompleteSource()

        @defaultCalendar = new ComboBox
            el: @$('#default-calendar')
            source: app.calendars.toAutoCompleteSource()
            current: app.settings.get('defaultCalendar')
        @defaultCalendar.on 'change', @defaultCalendarChange

        @$('#importviewplaceholder').append new ImportView().render().$el

        # Show the modal.
        @$el.modal 'show'

        # Manage global interactions to close it.
        $(document).on 'keydown', @hideOnEscape

        @$el.on 'hidden', =>
            $(document).off('keydown', @hideOnEscape)

            # Redirects to home page.
            options = trigger: false, replace: true
            window.app.router.navigate '', options

            # The actual remove is done when modal is hidden, because it is
            # bound to behaviours managed by Bootsrap.
            @remove()


    # Close the modal when key `ESCAPE` is pressed.
    hideOnEscape: (event) =>
        @close() if 27 in [event.which, event.keyCode]


    # Close the modal.
    close: ->
        @$el.modal 'hide'


    exportCalendar: ->
        calendarId = @calendar.value()
        if calendarId in app.calendars.toArray()
            encodedName = encodeURIComponent calendarId
            window.location = "export/#{encodedName}.ics"

        else
            alert t 'please select existing calendar'


    defaultCalendarChange: (value) ->
        app.settings.set 'defaultCalendar', value
        app.settings.save
            error: ->
                alert t 'default calendar change error'


    # creates a placeholder for the password
    getPlaceholder: (password) ->
        placeholder = []
        placeholder.push '*' for i in [1..password.length] by 1
        return placeholder.join ''


    showPassword: ->
        @$('#placeholder').html @model.token
        @$('#show-password').hide()
        @$('#hide-password').show()


    hidePassword: ->
        @$('#placeholder').html @model.placeholder
        @$('#hide-password').hide()
        @$('#show-password').show()
