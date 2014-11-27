async = require 'async'
CozyInstance = require '../models/cozy_instance'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'

module.exports.tags = (req, res, next) ->
    Event.tags (err, results) ->
        return next err if err

        {calendars, tags} = results
        res.send 200, {calendars, tags}

module.exports.index = (req, res) ->
    async.parallel [
        (cb) -> Contact.all (err, contacts) ->
            return cb err if err
            for contact, index in contacts
                contacts[index] = contact.asNameAndEmails()
            cb null, contacts

        Event.all

        (cb) -> CozyInstance.getLocale (err, locale) ->
            console.log err if err
            cb null, locale

    ], (err, results) ->

        if err then res.send
            error: 'Server error occurred while retrieving data'
            stack : err.stack
        else

            [contacts, events, locale] = results

            res.render 'index.jade', imports: """
                window.locale = "#{locale}";
                window.initevents = #{JSON.stringify events};
                window.initcontacts = #{JSON.stringify contacts};
            """

module.exports.userTimezone = (req, res) ->

    if req.query.keys isnt "timezone"
        res.send 403, "keys not exposed"
    else
        res.send User.timezone
