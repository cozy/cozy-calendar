PopoverScreenView = require 'lib/popover_screen_view'
Modal = require 'lib/modal'

module.exports = class DeletePopoverScreen extends PopoverScreenView

    screenTitle: t('screen delete title')

    # Override title template.
    templateTitle: require 'views/templates/popover_screens/delete_title'
    templateContent: require 'views/templates/popover_screens/delete'

    events:
        'click .answer-yes': 'onDelete'
        'click .answer-no': -> @switchToScreen('main')


    afterRender: ->
        @$spinner = @$ '.remove-spinner'
        @$removeChoices = @$ '.remove-choices'
        @$errors = @$ '.errors'

        @$spinner.hide()
        @$errors.hide()

    # Display a modal to confirm sending of emails to notify attendees
    confirmEmailNotifications: (model, callback) ->
        attendees = model.get('attendees') or []
        guestsToInform = attendees.filter (guest) ->
            return not guest.isSharedWithCozy and
                guest.status in ['ACCEPTED', 'NEEDS-ACTION']

        if guestsToInform.length
            guestsList = guestsToInform.map((guest) -> guest.label).join ', '
            modal = Modal.confirm t('modal send mails'),
                "#{t 'send delete notifications'} #{guestsList}", \
                t('yes'),
                t('no'),
                (result) -> callback null, result

            @context.clickOutListener.exceptOn [
                    modal.el,
                    modal.getBackdrop() ]

        else
            callback null, false


    onDelete: ->
        @$errors.hide()
        @$spinner.show()
        @$removeChoices.hide()

        @confirmEmailNotifications @model, (err, sendEmailNotifications) =>
            @model.destroy
                wait: true
                url: "#{@model.url()}?sendMails=#{sendEmailNotifications}"
                error: =>
                    @$removeChoices.show()
                    @$errors.html t('server error occured')
                    @$errors.show()
                success: =>
                    @$spinner.hide()
                    @popover.close()
