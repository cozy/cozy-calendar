module.exports = (compound, Event) ->

    Event.all = (params, callback) ->
        Event.request "all", params, callback

    require('cozy-ical/lib/event')(Event)