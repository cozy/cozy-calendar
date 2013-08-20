module.exports = class ScheduleItem extends Backbone.Model

    mainDateField: ''
    @dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00"

    getDateObject: ->
        if not @dateObject?
            @dateObject = new Date.create(@get(@mainDateField))
        return @dateObject

    getFormattedDate: (formatter) ->
        return @getDateObject().format formatter

    getPreviousDateObject: ->
        if @previous(@mainDateField)?
            return new Date.create @previous(@mainDateField)
        else return false

    getDateHash: (date) ->
        date = @getDateObject() unless date?
        return date.format '{yyyy}{MM}{dd}'

    getPreviousDateHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getDateHash(previousDateObject)
        else return false

    getTimeHash: (date) ->
        date = @getDateObject() unless date?
        return date.format '{yyyy}{MM}{dd}{HH}{mm}'

    getPreviousTimeHash: ->
        previousDateObject = @getPreviousDateObject()
        if previousDateObject
            return @getTimeHash(previousDateObject)
        else return false
