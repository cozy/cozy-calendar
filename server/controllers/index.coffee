time = require('time')
async = require('async')
i18n = require('cozy-i18n-helper')
Alarm = require '../models/alarm'
Event = require '../models/event'
User  = require '../models/user'

module.exports.index = (req, res) ->
    async.parallel [
        (cb) => Alarm.all (err, alarms) =>
            return cb err if err
            for alarm, index in alarms
                alarms[index] = alarm.timezoned User.timezone

            cb null, alarms

        (cb) => Event.all (err, events) =>
            return cb err if err
            for evt, index in events
                events[index] = evt.timezoned User.timezone

            cb null, events

        (cb) => i18n.getLocale null, (err, locale) ->
            console.log err if err
            cb null, locale

    ], (err, results) =>

        if err then send
            error: 'Server error occurred while retrieving data'
            stack : err.stack
        else

            [alarms, events, locale] = results

            res.render 'index.jade', imports: """
                window.locale = "#{locale}";
                window.initalarms = #{JSON.stringify(alarms)};
                window.initevents = #{JSON.stringify(events)};
            """