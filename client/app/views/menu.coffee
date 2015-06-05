colorhash = require 'lib/colorhash'
ViewCollection = require '../lib/view_collection'
ComboBox    = require 'views/widgets/combobox'
Event       = require 'models/event'
Tag = require 'models/tag'

module.exports = class MenuView extends ViewCollection

    tagName: 'div'
    id: 'menu'
    className: 'container nav nav-list sidenav'
    collectionEl: '#menuitems'
    template: require './templates/menu'
    itemview: require 'views/menu_item'

    events: ->
        'click .calendars': 'toggleDropdown'
        'click .calendar-add': 'onAddCalendar'
        'click .remove-cals': 'onCalendarMultipleRemove'
        'click .export-cals': 'onCalendarMultipleExport'

    # Check if a "New Calendar" already exists. If not, run the calendar
    # creation procedure.
    onAddCalendar: ->
        @tag = app.tags.getOrCreateByName "new calendar"

        calendar = app.calendars.find (tag) ->
            (tag.get('name') is t "new calendar") and tag.get 'visible'

        if calendar?
            alert t('calendar exist error')

        else
            @createNewCalendar()


    # Create a new event by adding a very old event with New Calendar as name.
    # Then activate renaming on this new calendar.
    createNewCalendar: (callback) ->
        @showLoading()

        # Since an event is needed to create a calendar, let's make a false one
        calendarEvent = new Event
            start: moment "19010101", "YYYYMMDD"
            end: moment "19010101", "YYYYMMDD"
            description: ''
            place: ''
            tags: [t "new calendar"]

        # saving the event, creating calendar
        calendarEvent.save null,
            wait: true
            success: =>
                # a timeout is needed for the created calendar to appear on
                # bottom of the menu items
                setTimeout =>
                    $('#menuitems li.tagmenuitem:last-of-type .calendar-rename')
                        .trigger("click")
                , 100
            complete: =>
                # Crappy timeout to match the input selection in `success`
                setTimeout @hideLoading.bind(@), 100
                setTimeout callback, 150 if callback?

    activate: (href) ->
        @$('.active').removeClass 'active'


    toggleDropdown: ->
        @$('#menuitems').toggleClass 'visible'

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

    showLoading: ->
        @$('.spinner').show()

    onCalendarMultipleExport: ->
        calendars = []
        $('.calendar-actions:checked').each ->
            calendars.push(@value)
        calendars = JSON.stringify calendars
        window.location = "exportzip/#{calendars}"

    hideLoading: ->
        @$('.spinner').hide()

