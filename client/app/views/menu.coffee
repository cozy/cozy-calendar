BaseView = require '../lib/base_view'


module.exports = class MenuView extends BaseView

    tagName: 'ul'
    id: 'menu'
    className: 'container'
    template: require './templates/menu'

    activate: (href) ->
        @$('.active').removeClass 'active'
        @$('a[href="#' + href + '"]').addClass 'active'