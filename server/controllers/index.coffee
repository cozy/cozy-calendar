async = require 'async'
Tag = require '../models/tag'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'
cozydb = require 'cozydb'
WebDavAccount = require '../models/webdavaccount'
log = require('printit')
    prefix: 'calendar:client'

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
        (cb) ->
            # Handle the case there User.timezone data is not cached yet.
            if User.timezone?
                cb null, User.timezone
            else
                User.updateUser ->
                    cb User.timezone


    ], (err, results) ->

        if err then res.send
            error: 'Server error occurred while retrieving data'
            stack : err.stack
        else

            [
                contacts, tags, events, instance, webDavAccount, timezone
            ] = results

            locale = instance?.locale or 'en'
            if webDavAccount?
                webDavAccount.domain = instance?.domain or ''

            timezone = timezone or 'UTC'

            res.render 'index.jade', imports: """
                window.locale = "#{locale}";
                window.inittags = #{JSON.stringify tags};
                window.initevents = #{JSON.stringify events};
                window.initcontacts = #{JSON.stringify contacts};
                window.webDavAccount = #{JSON.stringify webDavAccount};
                window.timezone = #{JSON.stringify timezone};
            """
module.exports.logClient = (req, res) ->
    log.error req.body.data
    log.error req.body.data.error?.stack
    res.send 'ok'
