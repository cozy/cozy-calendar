PopoverScreenView = require 'lib/popover_screen_view'

module.exports = class DeletePopoverScreen extends PopoverScreenView

    # Override title template.
    templateTitle: require 'views/templates/popover_screens/delete_title'
    templateContent: require 'views/templates/popover_screens/delete'

    events:
        'click .answer-yes': 'onDelete'
        'click .answer-no': -> @switchToScreen('main')


    initialize: (options) ->
        super(options)

        # Generate screen title using the model.
        @screenTitle = "Delete \"#{@model.get('description')}\""


    afterRender: ->
        @$spinner = @$ '.remove-spinner'
        @$removeChoices = @$ '.remove-choices'
        @$errors = @$ '.errors'

        @$spinner.hide()
        @$errors.hide()


    onDelete: ->
        @$errors.hide()
        @$spinner.show()
        @$removeChoices.hide()
        @model.destroy
            wait: true
            error: =>
                @$removeChoices.show()
                @$errors.html t('server error occured')
                @$errors.show()
            success: =>
                @$spinner.hide()
                @popover.selfclose()
