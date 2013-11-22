Event = require '../models/event'
async = require 'async'
jade = require 'jade'
fs = require 'fs'
try CozyAdapter = require('americano-cozy/node_modules/jugglingdb-cozy-adapter')
catch e then CozyAdapter = require('jugglingdb-cozy-adapter')



module.exports = class MailHandler

    # compile templates
    constructor: () ->
        @templates = {}

        file = __dirname + '/mail_invitation.jade'
        fs.readFile file, 'utf8', (err, jadeString) =>
            throw err if err
            @templates.invitation = jade.compile jadeString

        file = __dirname + '/mail_update.jade'
        fs.readFile file, 'utf8', (err, jadeString) =>
            throw err if err
            @templates.update = jade.compile jadeString

        file = __dirname + '/mail_delete.jade'
        fs.readFile file, 'utf8', (err, jadeString) =>
            throw err if err
            @templates.deletion = jade.compile jadeString


    sendInvitations: (event, callback) ->

        async.forEach event.toJSON().attendees, (guest, cb) =>
            if guest.status is 'INVITATION-NOT-SENT'
                subject = "Invitation : " + event.description
                template = @templates.invitation

            # else if guest.status is 'ACCEPTED'
            #     subject = "This event has changed : " + event.description
            #     template = @templates.update

            else return cb null

            mailOptions =
                to: guest.email
                subject: subject
                html: template
                    event: event.toJSON()
                    key: guest.key

            CozyAdapter.sendMailFromUser mailOptions, (err) ->
                if not err
                    event.updateAttributes cb

        , callback

    sendDeleteNotification: (event, callback) ->

        async.forEach event.toJSON().attendees, (guest, cb) =>
            return cb null unless guest.status is 'ACCEPTED'

            mailOptions =
                to: guest.email
                subject: "This event has been canceled : " + event.description
                html: @templates.deletion
                    event: event.toJSON()
                    key: guest.key

            CozyAdapter.sendMailFromUser mailOptions, (err) ->
                if not err
                    event.updateAttributes cb

        , callback