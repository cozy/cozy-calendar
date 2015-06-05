BaseView = require 'lib/base_view'

module.exports = class SettingsModals extends BaseView

    id: 'settings-modal'
    className: 'modal fade'
    attributes: 'data-keyboard': false

    template: require('./templates/settings_modal')

    afterRender: ->

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
    hideOnEscape: (e) ->
        # escape from outside a datetimepicker
        @close() if e.which is 27 and not e.isDefaultPrevented()


    # Close the modal.
    close: -> @$el.modal 'close'
