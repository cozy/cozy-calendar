BaseView = require 'lib/base_view'

# Represent a popup view
module.exports = class PopupView extends BaseView

    initialize: (options) ->
        super
        @anchor = options.anchor

        @addClickOutListener options.document, => @hide()
            .exceptOn @anchor.get 0


    hide: ->
        @$el.hide()
        @


    toggle: (display)->
        @$el.toggle display
        @
