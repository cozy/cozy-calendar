BaseView = require '../lib/base_view'


module.exports = class AlarmView extends BaseView

    tagName: 'ul'
    id: 'menu'
    template: require './templates/menu'

    activate: (href) ->
        @$('.active').removeClass 'active'
        @$('a[href="#' + href + '"]').addClass 'active'