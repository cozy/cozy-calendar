BaseView  = require 'lib/base_view'
TagCollection = require 'collections/tags'
Tag = require 'models/tag'

module.exports = class ComboBox extends BaseView

    events:
        'keyup': 'onChange'
        'keypress': 'onChange'
        'change': 'onChange'
        'blur': 'onBlur'


    initialize: (options) ->
        super()

        @source = options.source

        @$el.autocomplete
            delay: 0
            minLength: 0
            source: @source
            close: @onClose
            open: @onOpen
            select: @onSelect
        @$el.addClass 'combobox'
        @small = options.small

        @autocompleteWidget = @$el.data 'ui-autocomplete'
        @autocompleteWidget._renderItem = @renderItem

        isInput = @$el[0].nodeName.toLowerCase() is 'input'
        method = @$el[if isInput then "val" else "text"]

        @on 'edition-complete', @onEditionComplete

        unless @small
            caret = $ '<a class="combobox-caret">'
            caret.append $ '<span class="caret"></span>'
            caret.click @openMenu
            @$el.after caret

        value = options.current or @getDefaultValue()
        @onEditionComplete value


    openMenu: =>
        @menuOpen = true
        @$el.addClass 'expanded'
        @$el.focus().val(@value()).autocomplete 'search', ''
        # when clicking on menu, auto selecting the input so that it
        # can be updated when typing
        @$el[0].setSelectionRange 0, @value().length


    getDefaultValue: ->
        # Select the first calendar by default
        return @source[0].label


    value: =>
        @$el.val()


    setValue: (value) =>
        @$el.val value
        @onSelect()


    save: ->
        if @tag and @tag.isNew()
            @tag.save
                success: ->
                    @tags.add @tag


    onOpen: =>
        @menuOpen = true


    onClose: =>
        @menuOpen = false
        @$el.removeClass 'expanded' unless @$el.is ':focus'


    onBlur: =>
        @$el.removeClass 'expanded' unless @menuOpen
        @trigger 'edition-complete', @value()


    onSelect: (ev, ui) =>
        @$el.blur().removeClass 'expanded'
        @onChange ev, ui
        @trigger 'edition-complete', ui?.item?.value or @value()


    onEditionComplete: (name) =>
        @tag = app.tags.getOrCreateByName name
        @buildBadge @tag.get('color')


    onChange: (ev, ui) =>
        value = ui?.item?.value or @value()
        generatedColor = ColorHash.getColor value, 'cozy'
        @buildBadge generatedColor
        @trigger 'change', value

        _.debounce @onEditionComplete(value), 500
        return true


    renderItem: (ul, item) =>
        link = $("<a>").text(item.label).prepend @makeBadge item.color
        ul.append $('<li>').append(link).data 'ui-autocomplete-item', item


    buildBadge: (color) ->
        @badge?.remove()
        @badge = @makeBadge color
        @$el.before @badge


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

