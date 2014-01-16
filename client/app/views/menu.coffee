ViewCollection = require '../lib/view_collection'


module.exports = class MenuView extends ViewCollection

    tagName: 'ul'
    id: 'menu'
    className: 'container'
    template: require './templates/menu'
    itemview: require 'views/menu_item'

    activate: (href) ->
        @$('.active').removeClass 'active'
        @$('a[href="#' + href + '"]').addClass 'active'

    addItem: (model) ->
        return if model.get('type') isnt 'calendar'
        super