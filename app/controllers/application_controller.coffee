# TODO debug forgery with singe page application
#before 'protect from forgery', ->
#    protectFromForgery '014bab01fb364db464d3f1c9a4c4fe8e4032ed0b'


before ->

    time = require('time')

    @convertAlarmDate = (alarm, timezone) ->
        timezonedDate = new time.Date(alarm.trigg, 'UTC')
        timezonedDate.setTimezone(timezone)
        alarm.trigg = timezonedDate.toString().slice(0, 24)
        return alarm

    @convertEventDate = (evt, timezone) ->
        # Convert dates from UTC to user timezone
        timezonedDate = new time.Date(evt.start, 'UTC')
        timezonedDate.setTimezone(timezone)
        evt.start = timezonedDate.toString().slice(0, 24)
        timezonedDate = new time.Date(evt.end, 'UTC')
        timezonedDate.setTimezone(timezone)
        evt.end = timezonedDate.toString().slice(0, 24)
        return evt

    @userTimezone = 'Europe/Paris'
    User.all (err, users) =>
        if err
            console.log err
        else if users.length is 0
            console.log 'No user registered.'
        else
            @userTimezone = users[0].timezone

        next()

action 'index', ->

    async = require('async')
    i18n = require('cozy-i18n-helper')
    async.parallel [
        (cb) => Alarm.all (err, alarms) =>
            return cb err if err
            for alarm, index in alarms
                alarms[index] = @convertAlarmDate(alarm, @userTimezone)

            cb null, alarms

        (cb) => Event.all (err, events) =>
            return cb err if err
            for evt, index in events
                events[index] = @convertEventDate(evt, @userTimezone)

            cb null, events

        (cb) => i18n.getLocale null, (err, locale) ->
            console.log err if err
            cb null, locale

    ], (err, results) =>

        if err
            send
                stack : err.stack
                error: true
                msg: 'Server error occurred while retrieving data'
        else

            [alarms, events, locale] = results

            imports = """
                window.locale = "#{locale}";
                window.initalarms = #{JSON.stringify(alarms)};
                window.initevents = #{JSON.stringify(events)};
            """

            res.render 'index.jade', imports: imports