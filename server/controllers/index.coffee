async = require 'async'
CozyInstance = require '../models/cozy_instance'
Tag = require '../models/tag'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'

module.exports.index = (req, res) ->
    async.parallel [
        (cb) -> Contact.all (err, contacts) ->
            return cb err if err
            for contact, index in contacts
                contacts[index] = contact.asNameAndEmails()
            cb null, contacts

        Tag.all
        Event.all

        (cb) -> CozyInstance.getLocale (err, locale) ->
            console.log err if err
            cb null, locale

    ], (err, results) ->

        if err then res.send
            error: 'Server error occurred while retrieving data'
            stack : err.stack
        else

            [contacts, tags, events, locale] = results

            res.render 'index.jade', imports: """
                window.locale = "#{locale}";
                window.inittags = #{JSON.stringify tags};
                window.initevents = #{JSON.stringify events};
                window.initcontacts = #{JSON.stringify contacts};
            """

module.exports.userTimezone = (req, res) ->

    if req.query.keys isnt "timezone"
        res.send 403, "keys not exposed"
    else
        res.send User.timezone
