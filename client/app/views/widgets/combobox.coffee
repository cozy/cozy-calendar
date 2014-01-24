colorhash = require 'lib/colorhash'
BaseView  = require 'lib/base_view'

module.exports = class ComboBox extends BaseView

    events:
        'keyup': 'updateBadge'
        'keypress': 'updateBadge'
        'change': 'updateBadge'
        'autocompleteselect': 'updateBadge'

    initialize: (options) ->
        super
        @$el.autocomplete
            delay: 0
            minLength: 0
            source: options.source
        @$el.addClass 'combobox'

        @autocompleteWidget = @$el.data('ui-autocomplete')
        @autocompleteWidget._renderItem = @renderItem

        caret = $('<a class="combobox-caret">')
        caret.append $('<span class="caret"></span>')
        caret.click =>
            @$el.focus().val(@$el.val()).autocomplete 'search', ''
        @$el.after caret
        @updateBadge() if @$el.val() isnt ''

    updateBadge: (ev, ui) ->
        @badge?.remove()
        value = ui?.item?.value or @$el.val()
        @badge = @makeBadge colorhash value
        @$el.before @badge
        return true

    renderItem: (ul, item) =>
        color = colorhash item.label
        link = $("<a>").text(item.label).prepend @makeBadge color
        ul.append $('<li>').append(link).data 'ui-autocomplete-item', item

    makeBadge: (color) ->
        badge = $('<span class="badge combobox-badge">')
        .html('&nbsp;').css('backgroundColor', color)

    remove: =>
        @autocompleteWidget.destroy()
        super