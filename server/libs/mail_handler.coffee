async = require 'async'
fs    = require 'fs'
os    = require 'os'
path  = require 'path'
log   = require('printit')
    prefix: 'MailHandler'
    date: true

cozydb = require 'cozydb'
User   = require '../models/user'

{VCalendar} = require 'cozy-ical'

localization = require('cozy-localization-manager').getInstance()

app = null
render = (view, locales, callback)->
    throw new Error('need to call mail_handler.initialize') unless app
    app.render view, locales, callback

module.exports.initialize = (appref) ->
    app = appref

_makeTemplateOptions = (event, user, domain, guest) ->
    {description, place} = event.toJSON()
    place = if place?.length > 0 then place else ""
    date = _formatDate(event)
    url     = "#{domain}public/calendar/events/#{event.id}"
    options =
        displayName:  user.name
        displayEmail: user.email
        description:  description
        place:        place
        key:          guest.key
        date:         date
        url:          url
    return options


_makeMailHTML = (template, locales, callback) ->
    locale = localization.polyglot.locale()
    view = "mails/#{locale}/#{template}"
    # Build mails
    render view, locales, callback

_makeICSFile = (event, user) ->
    # Attach event as ics file
    calendarOptions =
        organization:'Cozy Cloud'
        title: 'Cozy Calendar'
        method: 'REQUEST'

    calendar = new VCalendar calendarOptions
    vEvent = event.toIcal()

    # Force the event to take into account the organizer
    vEvent.model.organizer =
        displayName: user.name
        email: user.email
    vEvent.build()

    calendar.add vEvent
    icsPath = path.join os.tmpdir(), 'invite.ics'
    fs.writeFile icsPath, calendar.toString(), (err) ->
        if (err)
            log.error """
              An error occured while creating invitation file #{icsPath}
            """
            log.error err
        else
            'email date format'

    return icsPath


_formatDate = (event) ->
    dateFormatKey = if event.isAllDayEvent()
        'email date format allday'
    else
        'email date format'

    dateFormat    = localization.t dateFormatKey
    locale    = localization.polyglot.locale
    return event.formatStart dateFormat, locale

_sendMail = (guest, subject, html, content, callback) ->
    mailOptions =
        to:      guest.email
        subject: subject
        html:    html
        content: content
        attachments: [
            path: path.resolve __dirname, '../assets/cozy-logo.png'
            filename: 'cozy-logo.png'
            cid: 'cozy-logo'
        ]
    # Send mail through CozyDB API
    cozydb.api.sendMailFromUser mailOptions, callback

_getDomainAndPrepareICS = (event, callback) ->
    async.parallel [
        (cb) -> cozydb.api.getCozyDomain cb
        (cb) -> User.getUserInfos cb
    ], (err, results) ->
        return callback err if err
        [domain, user] = results
        icsPath = _makeICSFile event, user, (err) ->
            return callback err if err
            callback null, [domain, user, icsPath]

module.exports.sendInvitations = (event, dateChanged, callback) ->
    guests = event.toJSON().attendees
    needSaving = false

    if dateChanged
        htmlTemplate = 'mail_update'
        subjectKey   = 'email update title'
        templateKey  = 'email update content'
    else
        htmlTemplate = 'mail_invite'
        subjectKey   = 'email invitation title'
        templateKey  = 'email invitation content'

    # Get mail contents
    subject = localization.t subjectKey, description: event.description

    _getDomainAndPrepareICS event, (err, results) ->
        return callback err if err
        [domain, user, icsPath] = results

        async.eachSeries guests, (guest, next) ->

            # only process relevant guests, quits otherwise
            shouldSend = not guest.isSharedWithCozy and \
                (guest.status is 'INVITATION-NOT-SENT' or \
                (guest.status is 'ACCEPTED' and dateChanged))
            return next() unless shouldSend

            templateOptions = _makeTemplateOptions event, user, domain, guest
            content = localization.t templateKey, templateOptions

            _makeMailHTML htmlTemplate, templateOptions, (err, html) ->
                return callback err if err
                _sendMail guest, subject, html, content, (err) ->
                    if err
                        log.error "An error occured while sending invitation"
                        log.error err
                    else
                        needSaving   = true
                        guest.status = 'NEEDS-ACTION' # ical = waiting an answer

        # Catch errors when doing async foreach
        , (err) ->
            fs.unlink icsPath, (errUnlink) ->
                if errUnlink
                    log.error "Error deleting ics file #{icsPath}"
            if err?
                callback err
            else unless needSaving
                callback()
            else
                event.updateAttributes attendees: guests, callback


module.exports.sendDeleteNotification = (event, callback) ->
    guests = event.toJSON().attendees
    # only process guests that have accepted to attend the event
    guestsToInform = guests.filter (guest) ->
        return guest.status in ['ACCEPTED', 'NEEDS-ACTION']
    User.getUserInfos (err, user) ->
        return callback err if err

        async.eachSeries guestsToInform, (guest, done) ->

            templateOptions = _makeTemplateOptions event, user
            subjectKey = 'email delete title'
            subject = localization.t subjectKey, description: event.description
            content = localization.t 'email delete content', templateOptions
            _makeMailHTML 'mail_delete', templateOptions, (err, html) ->
                return callback err if err
                _sendMail guest, subject, html, content, (err) ->
                    if err?
                        log.error "An error occured while sending email"
                        log.error err

                    done err

        , callback
