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
        'click .calendar-export': 'onExportCalendar'

        'click .dropdown-toggle': 'hideColorPicker'
        'click .calendar-color': 'showColorPicker'
        'change .color-picker': 'setColor'



    getRenderData: ->
        label: @model.get 'name'

    afterRender: ->
        @buildBadge @model.get 'color'

    toggleVisible: ->
        unless app.router.onCalendar
            app.router.navigate 'calendar', true
        @startSpinner()
        # make asynchronous to allow the spinner to show up, before make.set
        # and it's heavy load events chain block the UI for à while.
        setTimeout =>
                @model.set 'visible', not @model.get 'visible'
                @stopSpinner()
                @render()
            , 1

    showColorPicker: (ev) ->
        ev?.stopPropagation() # avoid dropdown auto close.

        @$('.color-picker').show()
        @$('.calendar-color').hide()

        # TinyColorPicker seems buggy, refresh it on each open.
        @colorPicker = @$('.color-picker')
        @colorPicker.tinycolorpicker()
        @$('.track').attr 'style', 'display: block;'

    hideColorPicker: =>
        @$('.color-picker').hide()
        @$('.calendar-color').show()

    setColor: (ev)  ->
        color = @colorPicker.data()?.plugin_tinycolorpicker?.colorHex
        @model.set 'color', color
        @buildBadge color
        @model.save()

        @$('.dropdown-toggle').dropdown 'toggle'
        @hideColorPicker()

        # Gone after succefull color pick, put it back.
        @$('.dropdown-toggle').on 'click', @hideColorPicker


    #setting rename validation function to avoid code duplication
    onRenameValidation: (input, calendarName) ->
        @startSpinner()
        # removes the binding to prevent memory leak
        input.off 'keyup'
        app.calendars.rename calendarName, input.val(), =>
            @stopSpinner()

    onRenameCalendar: ->
        calendarName = @model.get 'name'

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

        # Binds event to actually rename the calendar (enter key and blur)
        input.blur (event) =>
            console.log(calendarName)
            @onRenameValidation input, calendarName

        input.keyup (event) =>
            key = event.keyCode or event.charCode
            if key is 13 # enter key
                @onRenameValidation input, calendarName
            else
                @buildBadge colorhash input.val()

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
        calendarName = @model.get 'name'
        message = t 'confirm delete calendar', {calendarName}
        if confirm(message)
            @startSpinner()
            app.calendars.remove calendarName, =>
                @stopSpinner()

    onExportCalendar: ->
        calendarName = @model.get 'name'
        window.location = "export/#{calendarName}.ics"

    buildBadge: (color) ->
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
