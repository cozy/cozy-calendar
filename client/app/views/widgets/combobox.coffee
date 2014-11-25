colorhash = require 'lib/colorhash'
BaseView  = require 'lib/base_view'

module.exports = class ComboBox extends BaseView

    events:
        'keyup': 'updateBadge'
        'keypress': 'updateBadge'
        'change': 'updateBadge'
        'blur': 'onBlur'

    initialize: (options) ->
        super()

        @$el.autocomplete
            delay: 0
            minLength: 0
            source: options.source
            close: @onClose
            open: @onOpen
            select: @onSelect
        @$el.addClass 'combobox'
        @small = options.small

        @autocompleteWidget = @$el.data 'ui-autocomplete'
        @autocompleteWidget._renderItem = @renderItem

        isInput = @$el[0].nodeName.toLowerCase() is 'input'
        method = @$el[if isInput then "val" else "text"]
        @value = => method.apply @$el, arguments

        unless @small
            caret = $ '<a class="combobox-caret">'
            caret.append $ '<span class="caret"></span>'
            caret.click @openMenu
            @$el.after caret

        @updateBadge()

    openMenu: =>
        @menuOpen = true
        @$el.addClass 'expanded'
        @$el.focus().val(@value()).autocomplete 'search', ''

    onOpen: => @menuOpen = true

    onClose: =>
        @menuOpen = false
        @$el.removeClass 'expanded' unless @$el.is ':focus'

    onBlur: =>
        @$el.removeClass 'expanded' unless @menuOpen

    onSelect: (ev, ui) =>
        @$el.blur().removeClass 'expanded'
        @updateBadge ev, ui

    updateBadge: (ev, ui) =>
        @badge?.remove()
        value = ui?.item?.value or @value()
        @badge = @makeBadge colorhash value
        @$el.before @badge
        @trigger 'change', value
        return true

    renderItem: (ul, item) =>
        color = colorhash item.label
        link = $("<a>").text(item.label).prepend @makeBadge color
        ul.append $('<li>').append(link).data 'ui-autocomplete-item', item

    makeBadge: (color) ->
        badge = $ '<span class="badge combobox-badge">'
        .html '&nbsp;'
        .css 'backgroundColor', color
        .css 'cursor', 'pointer'
        .click @openMenu

        if @small
            badge.attr 'title', t 'change calendar'

        return badge

    remove: =>
        @autocompleteWidget.destroy()
        super