time = require('time')
async = require('async')
i18n = require('cozy-i18n-helper')

convertAlarmDate = (alarm, timezone) ->
    timezonedDate = new time.Date(alarm.trigg, 'UTC')
    timezonedDate.setTimezone(timezone)
    alarm.trigg = timezonedDate.toString().slice(0, 24)
    return alarm

convertEventDate = (evt, timezone) ->
    # Convert dates from UTC to user timezone
    timezonedDate = new time.Date(evt.start, 'UTC')
    timezonedDate.setTimezone(timezone)
    evt.start = timezonedDate.toString().slice(0, 24)
    timezonedDate = new time.Date(evt.end, 'UTC')
    timezonedDate.setTimezone(timezone)
    evt.end = timezonedDate.toString().slice(0, 24)
    return evt

module.exports.index = (req, res) ->
    async.parallel [
        (cb) => Alarm.all (err, alarms) =>
            return cb err if err
            for alarm, index in alarms
                alarms[index] = convertAlarmDate alarm, User.timezone

            cb null, alarms

        (cb) => Event.all (err, events) =>
            return cb err if err
            for evt, index in events
                events[index] = convertEventDate evt, User.timezone

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