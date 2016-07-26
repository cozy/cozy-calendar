ViewCollection = require '../lib/view_collection'
ComboBox    = require 'views/widgets/combobox'
Event       = require 'models/event'
Tag = require 'models/tag'


module.exports = class MenuView extends ViewCollection

    tagName: 'aside'
    className: 'drawer nav'
    collectionEl: '#menuitems'
    template: require './templates/menu'
    itemview: require 'views/menu_item'

    events: ->
        'click .calendar-add': 'onAddCalendar'
        'click .remove-cals': 'onCalendarMultipleRemove'
        'click .export-cals': 'onCalendarMultipleExport'


    afterRender: ->
        super
        @$('.main-spinner').hide()


    # Get a name for the new calendar. If "new calendar" already exists,
    # ad a number at the end
    onAddCalendar: ->
        n = 0
        name = "new calendar"

        # check if a calendar with this name already exists
        checkCalendar = ->
            @tag = app.tags.getOrCreateByName name

            calendar = app.calendars.find (tag) ->
                localName = t name
                localName = "#{localName} #{n}" if n > 0
                (tag.get('name') is localName) and tag.get 'visible'

            return calendar?

        exists = checkCalendar()
        while exists
            n++
            exists = checkCalendar()

        localName = t name
        localName = "#{localName} #{n}" if n > 0
        @createNewCalendar localName


    # Create a new event by adding a very old event with New Calendar as name.
    # Then activate renaming on this new calendar.
    createNewCalendar: (name) ->
        @showLoading()

        # Since an event is needed to create a calendar, let's make a false one
        calendarEvent = new Event
            start: moment "19010101", "YYYYMMDD"
            end: moment "19010101", "YYYYMMDD"
            description: ''
            place: ''
            tags: [name]

        # saving the event, creating calendar
        calendarEvent.save null,
            wait: true
            success: ->
                # TODO: All this should be in CalendarCollection
                app.calendars.add app.tags.getOrCreateByName name
                # wait for the newly created calendar to appear in the DOM
                wait = setInterval ->
                    newCalSel = """
                     #menuitems li.tagmenuitem[data-name='#{name}']
                    """
                    rename = $("#{newCalSel} .calendar-rename")
                    if rename.length > 0
                        clearInterval wait
                        rename.trigger("click")
                , 100
            complete: =>
                # Crappy timeout to match the input selection in `success`
                setTimeout @hideLoading.bind(@), 100


    activate: (href) ->
        @$('.active').removeClass 'active'


    # toggleDrawer: ->
    #     isVisible = @$el.attr('aria-expanded') is 'true'
    #     @$el.attr 'aria-expanded', not isVisible


    onCalendarMultipleRemove: ->
        message = t 'confirm delete selected calendars'
        if confirm(message)
            $('.calendar-actions:checked').each ->
                calendarName = @value
                tag = app.tags.getByName calendarName
                app.calendars.remove calendarName

        # remove additional menu if only 1 calendar is left
        if $('#menu-items .calendar-name').length < 2
            $('#multiple-actions').addClass 'hidden'


    onCalendarMultipleExport: ->
        calendars = []
        $('.calendar-actions:checked').each ->
            calendars.push @value
        calendars = JSON.stringify calendars
        window.location = "exportzip/#{calendars}"


    showLoading: ->
        @$('.main-spinner').show()
        @$('.add-calendar-icon').hide()


    hideLoading: ->
        @$('.main-spinner').hide()
        @$('.add-calendar-icon').show()

