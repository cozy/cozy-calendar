BaseView = require 'lib/base_view'

# Represent a popup view
module.exports = class PopupView extends BaseView

    initialize: (options) ->
        super
        @anchor = options.anchor


    hide: ->
        @$el.hide()
        @


    toggle: (display)->
        @$el.toggle display
        @
