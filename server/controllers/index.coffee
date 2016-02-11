async = require 'async'
Tag = require '../models/tag'
Event = require '../models/event'
Contact = require '../models/contact'
User  = require '../models/user'
cozydb = require 'cozydb'
WebDavAccount = require '../models/webdavaccount'
log = require('printit')
    prefix: 'calendar:client'

module.exports.index = (req, res, next) ->
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
                    cb null, User.timezone


    ], (err, results) ->

        return next err if err


        [
            contacts, tags, events, instance, webDavAccount, timezone
        ] = results

        locale = instance?.locale or 'en'
        if webDavAccount?
            webDavAccount.domain = instance?.domain or ''

        timezone = timezone or 'UTC'

        # Objects returned by the database may contain characters that need to
        # be escaped to prevent error in some browsers
        sanitize = (obj) ->
            return """
              JSON.parse(decodeURI("#{encodeURI(JSON.stringify(obj))}"));
            """

        res.render 'index', imports: """
            window.locale = "#{locale}";
            window.inittags = #{sanitize tags};
            window.initevents = #{sanitize events}
            window.initcontacts = #{sanitize contacts};
            window.webDavAccount = #{sanitize webDavAccount};
            window.timezone = #{sanitize timezone};
        """

module.exports.logClient = (req, res) ->
    log.error req.body.data
    log.error req.body.data.error?.stack
    res.send 'ok'
