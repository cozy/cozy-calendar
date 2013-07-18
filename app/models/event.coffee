module.exports = (compound, Event) ->

    Event.all = (params, callback) ->
        Event.request "all", params, callback