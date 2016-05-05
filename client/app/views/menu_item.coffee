BaseView = require '../lib/base_view'
colorSet = require '../helpers/color-set'

module.exports = class MenuItemView extends BaseView

    tagName: 'li'
    className: 'tagmenuitem'
    template: require './templates/menu_item'

    events:
        'click > span': 'toggleVisible'
        'click .calendar-remove': 'onRemoveCalendar'
        'click .calendar-rename': 'onRenameCalendar'
        'click .calendar-export': 'onExportCalendar'

        'click .calendar-actions': 'onCalendarMultipleSelect'

        'click .dropdown-toggle': 'hideColorPicker'
        'click .calendar-color': 'showColorPicker'
        'click .color': 'setColor'
        'blur input.calendar-name': 'onRenameValidation'
        'keyup input.calendar-name': 'onRenameValidation'


    initialize: ->
        super()
        @listenTo @model, 'change', @onCalendarChange


    getRenderData: ->
        label: @model.get 'name'
        colorSet: colorSet


    afterRender: ->
        @el.dataset.name = @model.get 'name' # for renaming new calendars
        @buildBadge @model.get 'color'
        @hideLoading()


    toggleVisible: ->
        app.router.navigate 'calendar', true unless app.router.onCalendar
        @showLoading()
        # make asynchronous to allow the spinner to show up, before make.set
        # and it's heavy load events chain block the UI for à while.
        setTimeout =>
            @model.set 'visible', not @model.get 'visible'
            @hideLoading()
            @render()
        , 1


    showColorPicker: (event) ->
        event?.stopPropagation() # avoid dropdown auto close.
        @$('.color-picker').show()
        @$('.calendar-color').parent().attr 'data-picker-visible', true


    hideColorPicker: =>
        @$('.color-picker').hide()
        @$('.calendar-color').parent().attr 'data-picker-visible', false


    setColor: (ev)  ->
        color = @$(ev.target).css 'background-color'
        # Since jQuery always returns colors in rgb format, it must be converted
        # back to hexadecimal.
        color = @rgbToHex color
        @model.set 'color', color
        @buildBadge color
        @model.save()

        @$('.dropdown-toggle').dropdown 'toggle'
        @hideColorPicker()

        # Gone after succefull color pick, put it back.
        @$('.dropdown-toggle').on 'click', @hideColorPicker


    rgbToHex: (color) ->
        bg = color.match /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/
        hex = (x) ->
            return "0#{parseInt(x).toString(16)}".slice(-2)

        return "##{hex bg[1]}#{hex bg[2]}#{hex bg[3]}"


    onCalendarMultipleSelect: ->
        actionMenu = $('#multiple-actions')
        trashButton = $('.remove-cals', actionMenu)
        nbCalendars = $('.calendar-actions').length
        nbCalendarsChecked = $('.calendar-actions:checked').length
        # We display the additional menu if 2 cals or more are checked
        if nbCalendarsChecked > 1
            actionMenu.removeClass 'hidden'
        else
            actionMenu.addClass 'hidden'
        # We hide the trash icon if all calendars are selected
        if nbCalendarsChecked is nbCalendars
            trashButton.addClass 'hidden'
        else
            trashButton.removeClass 'hidden'


    onCalendarChange: ->
        # Update the label after a rename
        if @rawTextElement and @model.hasChanged 'name'
            @rawTextElement.html @model.get 'name'

        if @model.hasChanged 'color'
            @model.save()


    # Handle `blur` and `keyup` (`enter` and `esc` keys) events in order to
    # rename a calendar.
    onRenameValidation: (event) ->

        input = $ event.target
        calendarName = @model.get 'name'

        key = event.keyCode or event.charCode
        # `escape` key cancels the edition.
        if key is 27

            @hideInput input

        # `blur` event and `enter` key trigger the persistence
        else if (key is 13 or event.type is 'focusout')
            @showLoading()
            app.calendars.rename calendarName, input.val(), (name) =>
                @model.set 'name', name
                @model.set 'color', ColorHash.getColor(name, 'color')
                @hideLoading()
                @hideInput input
        else
            @buildBadge ColorHash.getColor(input.val(), 'color')


    # Replace the calendar's name by an input to edit the name.
    onRenameCalendar: ->
        calendarName = @model.get 'name'

        # Create the input and replace the raw text by it.
        template = """
        <input type="text" class="calendar-name" value="#{calendarName}"/>
        """
        input = $ template

        # Keep a reference to the text element so we can re-append it later.
        @rawTextElement = @$('.calendar-name').detach()
        input.insertAfter @$('.badge')

        # Hides the menu during edition.
        @$('.dropdown-toggle').hide()

        # Focus the input and select its value/
        input.focus()
        input[0].setSelectionRange 0, calendarName.length


    onRemoveCalendar: ->
        calendarName = @model.get 'name'
        message = t 'confirm delete calendar', {calendarName}

        if confirm(message)
            @showLoading()

            app.calendars.remove calendarName, =>
                @hideLoading()


    hideInput: (input, calendarName) ->
        input.remove()

        # re-appends text element
        @rawTextElement.insertAfter @$('.badge')

        # Restores the badge color
        @buildBadge @model.get 'color'

        # Shows the menu again
        @$('.dropdown-toggle').show()


    onExportCalendar: ->
        calendarName = @model.get 'name'
        encodedName = encodeURIComponent calendarName
        window.location = "export/#{encodedName}.ics"


    buildBadge: (color) ->
        visible = @model.get 'visible'
        backColor = if visible then color else "transparent"
        borderColor = if visible then "transparent" else color

        styles =
            'background-color': backColor
            'border': "1px solid #{borderColor}"
        @$('.badge').css styles


    showLoading: ->
        @$('.spinner').show()
        @$('.caret').addClass 'hidden'

    hideLoading: ->
        @$('.spinner').hide()
        @$('.caret').removeClass 'hidden'

