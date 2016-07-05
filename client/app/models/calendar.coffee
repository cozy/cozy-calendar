Tag = require './tag'

module.exports = class Calendar extends Tag

    initialize: (options) ->
        super options

        # When created via Data System, a calendar should not have any
        # color assigned. So we set it at initialization and will try
        # to save it as soon as a change is made on the calendar.
        color = @get 'color'
        @hasColorDefined =
            color and color.match /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

        if not @hasColorDefined
            # Temporary color until a save is made
            @set 'color', ColorHash.getColor @get 'name'


    # Take proffit of a saving to save the color.
    save: (attributes, options) ->
        attributes = attributes ?= {}
        if not @hasColorDefined and not attributes?.color?
            attributes.color = @get 'color'

        super attributes, options


