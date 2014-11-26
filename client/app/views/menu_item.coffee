BaseView = require '../lib/base_view'
colorhash = require 'lib/colorhash'

module.exports = class MenuItemView extends BaseView

    tagName: 'li'
    className: 'tagmenuitem'
    template: require './templates/menu_item'

    events:
        'click > span': 'toggleVisible'
        'click .calendar-remove': 'onRemoveCalendar'
        'click .calendar-rename': 'onRenameCalendar'

    toggleVisible: ->
        unless app.router.onCalendar
            app.router.navigate 'calendar', true
        @model.set 'visible', not @model.get 'visible'
        @render()

    getRenderData: ->
        label: @model.get 'label'

    afterRender: ->
        @buildBadge @model.get('label')

    onRenameCalendar: ->
        calendarName = @model.get 'label'

        # Creates the input and replace the raw text by it
        template = """
        <input type="text" class="calendar-name" value="#{calendarName}"/>
        """
        input = $ template
        # Keeps a reference to the text element so we can re-append it later
        rawTextElement = @$('.calendar-name').detach()
        input.insertAfter @$('.badge')

        # hides the menu during edition
        @$('.dropdown-toggle').hide()

        # focus the input and select its value
        input.focus()
        input[0].setSelectionRange 0, calendarName.length

        # Binds event to actually rename the calendar (enter key)
        input.keyup (event) =>
            key = event.keyCode or event.charCode
            if key is 13 # enter key
                @startSpinner()
                # removes the binding to prevent memory leak
                input.off 'keyup'
                @model.collection.rename calendarName, input.val(), =>
                    @stopSpinner()
            else
                @buildBadge input.val()

        # Close the form and restore original state when user presses "escape"
        $(document).keyup restore = (event) =>
            key = event.keyCode or event.charCode
            if key is 27 # escape key
                # removes the binding to prevent memory leak
                $(document).off 'keyup', 'document', restore
                input.off 'keyup'

                # re-appends text element
                input.remove()
                rawTextElement.insertAfter @$('.badge')

                # Restores the badge color
                @buildBadge calendarName

                # Shows the menu again
                @$('.dropdown-toggle').show()

    onRemoveCalendar: ->
        calendarName = @model.get 'label'
        message = t 'confirm delete calendar', {calendarName}
        if confirm(message)
            @startSpinner()
            @model.collection.remove calendarName, =>
                @stopSpinner()

    buildBadge: (calendarName)->
        color = colorhash calendarName
        visible = @model.get 'visible'
        backColor = if visible then color else "transparent"
        borderColor = if visible then "transparent" else color

        styles =
            'background-color': backColor
            'border': "1px solid #{borderColor}"
        @$('.badge').css styles

    startSpinner: ->
        @$('.spinHolder').spin 'tiny', '#000'

    stopSpinner: ->
        @$('.spinHolder').spin false
