async = require 'async'
jade = require 'jade'
fs = require 'fs'
moment = require 'moment'
log = require('printit')
    prefix: 'MailHandler'
    date: true

Event = require '../models/event'
CozyInstance = require '../models/cozy_instance'
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


    sendInvitations: (event, dateChanged, callback) ->

        guests = event.toJSON().attendees
        needSaving = false
        CozyInstance.getURL (err, domain) =>
            if err
                log.error 'Cannot get Cozy instance'
                console.log err.stack
                return callback()

            async.forEach guests, (guest, cb) =>
                ismail = guest.status is 'INVITATION-NOT-SENT' or (guest.status is 'ACCEPTED' and dateChanged)

                if guest.status is 'INVITATION-NOT-SENT' or
                (guest.status is 'ACCEPTED' and dateChanged)
                    subject = "Invitation: " + event.description
                    if dateChanged
                        template = @templates.update
                    else
                        template = @templates.invitation
                else
                    return cb()

                dateFormat = 'MMMM Do YYYY, h:mm a'
                date = event.formatStart dateFormat
                url = "https://#{domain}/public/calendar/events/#{event.id}"

                mailOptions =
                    to: guest.email
                    subject: subject
                    html: template
                        event: event.toJSON()
                        key: guest.key
                        date: date
                        url: url
                    content: """
Hello, I would like to invite you to the following event:

#{event.description} @ #{event.place}
on #{date}
Would you be there?

yes
#{url}?status=ACCEPTED&key=#{guest.key}

no
#{url}?status=DECLINED&key=#{guest.key}
"""

                CozyAdapter.sendMailFromUser mailOptions, (err) ->
                    if not err
                        needSaving = true
                        guest.status = 'NEEDS-ACTION' # ical = waiting an answer
                    else
                        log.error "An error occured while sending invitation"
                        console.log err.stack

                    cb err

            , (err) ->
                if err
                    callback err
                else if not needSaving
                    callback()
                else event.updateAttributes attendees: guests, callback


    sendDeleteNotification: (event, callback) ->

        async.forEach event.toJSON().attendees, (guest, cb) =>
            return cb null unless guest.status is 'ACCEPTED'
            dateFormat = 'MMMM Do YYYY, h:mm a'
            date = event.formatStart dateFormat

            mailOptions =
                to: guest.email
                subject: "This event has been canceled: " + event.description
                content: """
This event has been canceled:
#{event.description} @ #{event.location}
on #{date}
                """
                html: @templates.deletion
                    event: event.toJSON()
                    key: guest.key
                    date: date

            CozyAdapter.sendMailFromUser mailOptions, (err) ->
                if not err
                    needSaving = true
                    guest.status = 'NEEDS-ACTION' # ical = waiting an answer
                else
                    log.error "An error occured while sending invitation"
                    console.log err.stack

                cb err

        , callback
