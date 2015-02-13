async = require 'async'
CozyInstance = require '../models/cozy_instance'
Tag = require '../models/tag'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'
WebDavAccount = require '../models/webdavaccount'

module.exports.index = (req, res) ->
    async.parallel [
        (done) -> Contact.all (err, contacts) ->
            return done err if err
            for contact, index in contacts
                contacts[index] = contact.asNameAndEmails()
            done null, contacts

        Tag.all
        Event.all
        CozyInstance.first
        WebDavAccount.first

    ], (err, results) ->

        if err then res.send
            error: 'Server error occurred while retrieving data'
            stack : err.stack
        else

            [contacts, tags, events, instance, webDavAccount] = results

            locale = instance?.locale or 'en'
            if webDavAccount?
                webDavAccount.domain = instance?.domain or ''

            res.render 'index.jade', imports: """
                window.locale = "#{locale}";
                window.inittags = #{JSON.stringify tags};
                window.initevents = #{JSON.stringify events};
                window.initcontacts = #{JSON.stringify contacts};
                window.webDavAccount = #{JSON.stringify webDavAccount};
            """

module.exports.userTimezone = (req, res) ->

    if req.query.keys isnt "timezone"
        res.send 403, "keys not exposed"
    else
        res.send User.timezone
