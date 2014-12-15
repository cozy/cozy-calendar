ViewCollection = require '../lib/view_collection'


module.exports = class MenuView extends ViewCollection

    tagName: 'ul'
    id: 'menu'
    className: 'container nav nav-list'
    collectionEl: '#menuitems'
    template: require './templates/menu'
    itemview: require 'views/menu_item'

    events: ->
        'click .calendars': 'toggleDropdown'

    activate: (href) ->
        @$('.active').removeClass 'active'
        @$('a[href="#' + href + '"]').parent().addClass 'active'

    toggleDropdown: ->
        @$('#menuitems').toggleClass 'visible'
