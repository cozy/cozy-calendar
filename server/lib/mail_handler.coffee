Event = require '../models/event'
async = require 'async'
jade = require 'jade'
fs = require 'fs'
try CozyAdapter = require('americano/node_modules/jugglingdb-cozy-adapter')
catch e then CozyAdapter = require('jugglingdb-cozy-adapter')



module.exports = class MailHandler

    constructor: () ->
        @templates = {}

        fs.readFile __dirname + '/mail_invitation.jade', 'utf8', (err, jadeString) =>
            throw err if err
            @templates.invitation = jade.compile jadeString

        # fs.readFile './mail_update.jade', 'utf8', (err, jadeString) =>
        #     throw err if err
        #     @templates.update = jade.compile jadeString

        # fs.readFile './mail_delete.jade', 'utf8', (err, jadeString) =>
        #     throw err if err
        #     @templates.delete = jade.compile jadeString


    sendInvitations: (event, callback) ->

        async.forEach event.toJSON().attendees, (guest, cb) =>
            return cb null unless guest.status is 'INVITATION-NOT-SENT'

            mailOptions =
                to: guest.email
                subject: "Invitation : " + event.description
                html: @templates.invitation
                    event: event.toJSON()
                    key: guest.key

            CozyAdapter.sendMailFromUser mailOptions, cb

        , callback

    onEventChange: (event, id) ->
        # switch event
        #     when 'delete'
        #         Event.find id, (err, event) ->


        #     when 'create'


        #     when 'update'
