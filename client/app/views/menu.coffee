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

    onAddCalendar: ->
        @tag = app.tags.getOrCreateByName "new calendar"
        # Since an event is needed to create a calendar, let's make a false one
        calendarEvent = new Event
                start: moment("19010101", "YYYYMMDD")
                end: moment("19010101", "YYYYMMDD")
                description: ''
                place: ''
                tags: [t("new calendar")]
        # saving the event, creating calendar
        calendarEvent.save {}
        #a timeout is needed for the created calendar to appear on bottom of the menu items
        setTimeout ->
            $('#menuitems li.tagmenuitem:last-of-type .calendar-rename').trigger("click")
        ,100

    activate: (href) ->
        @$('.active').removeClass 'active'
        @$('a[href="#' + href + '"]').parent().addClass 'active'

    toggleDropdown: ->
        @$('#menuitems').toggleClass 'visible'
