Tag = require './tag'

module.exports = class Calendar extends Tag

    initialize: (options) ->
        super options

        # When created via Data System, a calendar should not have any
        # color assigned. So we set it at initialization and will try
        # to save it as soon as a change is made on the calendar.
        color = @get 'color'
        @hasValidColorStoredInDB = @isColorValid color

        if not @hasValidColorStoredInDB
            # Temporary color until a save is made
            @set 'color', ColorHash.getColor @get 'name'


    isColorValid: (color) ->
        return color? and /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test color


    # Take proffit of a saving to save the color.
    save: (attributes, options) ->
        attributes = attributes ?= {}
        if not @hasValidColorStoredInDB and not attributes?.color?
            attributes.color = @get 'color'

        # Add intermediate success callback to set @hasValidColorStoredInDB.
        options = options ?= {}
        successCallback = options.success
        options.success = (model, response, options) =>
            @hasValidColorStoredInDB = @isColorValid response.color
            if typeof successCallback is 'function'
                successCallback model, response, options

        super attributes, options
