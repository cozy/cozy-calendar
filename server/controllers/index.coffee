async = require 'async'
Tag = require '../models/tag'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'
cozydb = require 'cozydb'
WebDavAccount = require '../models/webdavaccount'

module.exports.index = (req, res) ->
    async.parallel [
        (done) -> Contact.all (err, contacts) ->
            return done err if err
            for contact, index in contacts
                contacts[index] = contact.asNameAndEmails()
            done null, contacts

        (cb) -> Tag.byName {}, cb
        (cb) -> Event.all cb
        (cb) -> cozydb.api.getCozyInstance cb
        (cb) -> WebDavAccount.first cb

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
