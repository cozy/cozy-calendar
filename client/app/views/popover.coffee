View = require '../lib/view'

module.exports = class PopOver extends View

    constructor: (@cal) ->

    clean: ->
        @field?.popover 'destroy'
        @field = null
        @date = null
        @unbindEvents() if @popoverWidget?
        @popoverWidget?.hide()

    unbindEvents: ->
        @popoverWidget.find('button.close').unbind 'click'

