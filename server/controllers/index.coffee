time = require('time')
async = require('async')
i18n = require('cozy-i18n-helper')
Alarm = require '../models/alarm'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'

module.exports.index = (req, res) ->
    async.parallel [
        (cb) => Contact.all (err, contacts) =>
            return cb err if err
            for contact, index in contacts
                contacts[index] = contact.asNameAndEmails()
            cb null, contacts

        (cb) => Alarm.all (err, alarms) =>
            return cb err if err
            for alarm, index in alarms
                alarms[index] = alarm.timezoned()

            cb null, alarms

        (cb) => Event.all (err, events) =>
            return cb err if err
            for evt, index in events
                events[index] = evt.timezoned()

            cb null, events

        (cb) => i18n.getLocale null, (err, locale) ->
            console.log err if err
            cb null, locale

    ], (err, results) =>

        if err then res.send
            error: 'Server error occurred while retrieving data'
            stack : err.stack
        else

            [contacts, alarms, events, locale] = results

            res.render 'index.jade', imports: """
                window.locale = "#{locale}";
                window.initalarms = #{JSON.stringify(alarms)};
                window.initevents = #{JSON.stringify(events)};
                window.initcontacts = #{JSON.stringify(contacts)};
            """