time = require('time')
async = require('async')
CozyInstance = require '../models/cozy_instance'
Alarm = require '../models/alarm'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'

module.exports.tags = (req, res, next) ->
    async.parallel [
        Event.tags
        Alarm.tags
    ], (err, results) ->
        return next err if err
        res.send
        
            calendars: results[0].calendar.concat results[1].calendar
            tags: results[0].tag.concat results[1].tag


module.exports.index = (req, res) ->
    async.parallel [
        (cb) => Contact.all (err, contacts) =>
            return cb err if err
            for contact, index in contacts
                contacts[index] = contact.asNameAndEmails()
            cb null, contacts

        Alarm.all

        # (cb) => Alarm.all (err, alarms) =>
        #     return cb err if err
        #     try
        #         for alarm, index in alarms
        #             alarms[index] = alarm.timezoned()
        #     catch err then cb err
        #     #stub
        #     # cb null, alarms
        #     cb null, []

        Event.all
        # (cb) => Event.all (err, events) =>
        #     return cb err if err
        #     try
        #         for evt, index in events
        #             events[index] = evt.timezoned()
        #     catch err then cb err
        #     cb null, events

        (cb) => CozyInstance.getLocale (err, locale) ->
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

module.exports.userTimezone = (req, res) ->

    if req.query.keys != "timezone"
        res.send "keys not exposed", 403
    
    else
        res.send User.timezone