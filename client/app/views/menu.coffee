colorhash = require 'lib/colorhash'
ViewCollection = require '../lib/view_collection'
ComboBox    = require 'views/widgets/combobox'
Event       = require 'models/event'
Tag = require 'models/tag'

module.exports = class MenuView extends ViewCollection

    tagName: 'ul'
    id: 'menu'
    className: 'container nav nav-list'
    collectionEl: '#menuitems'
    template: require './templates/menu'
    itemview: require 'views/menu_item'

    events: ->
        'click .calendars': 'toggleDropdown'
        'click .calendar-add': 'onAddCalendar'


    # Check if a "New Calendar" already exists. If not, run the calendar
    # creation procedure.
    onAddCalendar: ->
        @tag = app.tags.getOrCreateByName "new calendar"

        calendar = app.calendars.find (tag) ->
            (tag.get('name') is t "new calendar") and tag.get 'visible'

        if calendar?
            alert 'calendar exist error'

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
        @$('a[href="#' + href + '"]').parent().addClass 'active'


    toggleDropdown: ->
        @$('#menuitems').toggleClass 'visible'


    showLoading: ->
        @$('.spinner').show()


    hideLoading: ->
        @$('.spinner').hide()
