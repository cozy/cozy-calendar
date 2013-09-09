module.exports = (compound, Alarm) ->

    Alarm.all = (params, callback) ->
        Alarm.request "all", params, callback

    require('cozy-ical').decorateAlarm Alarm