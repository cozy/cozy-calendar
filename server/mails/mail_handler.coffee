async = require 'async'
jade = require 'jade'
fs = require 'fs'
log = require('printit')
    prefix: 'MailHandler'
    date: true

Event = require '../models/event'
User = require '../models/user'
cozydb = require 'cozydb'

localization = require '../libs/localization_manager'

module.exports.sendInvitations = (event, dateChanged, callback) ->
    guests = event.toJSON().attendees
    needSaving = false

    async.parallel [
        (cb) -> cozydb.api.getCozyDomain cb
        (cb) -> User.getUserInfos cb
    ], (err, results) ->
        return callback err if err

        [domain, user] = results

        async.forEach guests, (guest, done) ->

            shouldSend = guest.status is 'INVITATION-NOT-SENT' or \
                        (guest.status is 'ACCEPTED' and dateChanged)

            # only process relevant guests, quits otherwise
            return done() unless shouldSend

            if dateChanged
                htmlTemplate = localization.getEmailTemplate 'mail_update'
                subjectKey = 'email update title'
                templateKey = 'email update content'
            else
                htmlTemplate = localization.getEmailTemplate 'mail_invitation'
                subjectKey = 'email invitation title'
                templateKey = 'email invitation content'

            subject = localization.t subjectKey, description: event.description
            if event.isAllDayEvent()
                dateFormatKey = 'email date format allday'
            else
                dateFormatKey = 'email date format'
            dateFormat = localization.t dateFormatKey
            date = event.formatStart dateFormat

            url = "#{domain}public/calendar/events/#{event.id}"


            {description, place} = event.toJSON()
            place = if place?.length > 0 then place else false
            templateOptions =
                displayName: user.name
                displayEmail: user.email
                description: description
                place: place
                key: guest.key
                date: date
                url: url
            mailOptions =
                to: guest.email
                subject: subject
                html: htmlTemplate templateOptions
                content: localization.t templateKey, templateOptions

            cozydb.api.sendMailFromUser mailOptions, (err) ->
                if not err
                    needSaving = true
                    guest.status = 'NEEDS-ACTION' # ical = waiting an answer
                else
                    log.error "An error occured while sending invitation"
                    log.error err

                done err

        , (err) ->
            if err?
                callback err
            else if not needSaving
                callback()
            else event.updateAttributes attendees: guests, callback


module.exports.sendDeleteNotification = (event, callback) ->
    guests = event.toJSON().attendees
    # only process guests that have accepted to attend the event
    guestsToInform = guests.filter (guest) ->
        return guest.status in ['ACCEPTED', 'NEEDS-ACTION']

    User.getUserInfos (err, user) ->
        return callback err if err

        async.eachSeries guestsToInform, (guest, done) ->

            if event.isAllDayEvent()
                dateFormatKey = 'email date format allday'
            else
                dateFormatKey = 'email date format'
            dateFormat = localization.t dateFormatKey
            date = event.formatStart dateFormat
            {description, place} = event.toJSON()
            place = if place?.length > 0 then place else false
            templateOptions =
                displayName: user.name
                displayEmail: user.email
                description: description
                place: place
                date: date
            htmlTemplate = localization.getEmailTemplate 'mail_delete'
            subjectKey = 'email delete title'
            mailOptions =
                to: guest.email
                subject: localization.t subjectKey, description: event.description
                content: localization.t 'email delete content', templateOptions
                html: htmlTemplate templateOptions
            cozydb.api.sendMailFromUser mailOptions, (err) ->
                if err?
                    log.error "An error occured while sending email"
                    log.error err

                done err

        , callback
