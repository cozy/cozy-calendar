cozydb    = require 'cozydb'
Client    = require('request-json').JsonClient
urlHelper = require 'cozy-url-sdk'


module.exports.sendShareInvitations = (event, callback) ->
    guests     = event.toJSON().attendees
    needSaving = false

    # The format of the req.body to send must match:
    #
    # desc      : the sharing description
    # rules     : [{docType: "event", id: id_of_the_event}]
    # targets   : [
    #   {recipientUrl: guest-1-url-cozy},
    #   {recipientUrl: guest-2-url-cozy}, ...
    # ]
    # continuous: true
    data =
        desc       : event.description
        rules      : [{id: event.id, docType: 'event'}]
        targets    : []
        continuous : true

    # only process relevant guests
    guests.forEach (guest) ->
        if guest.status is 'INVITATION-NOT-SENT' and guest.shareWithCozy
            data.targets.push recipientUrl: guest.cozy
            guest.status = "NEEDS-ACTION"
            needSaving   = true

    # Send the request to the datasystem
    client = new Client urlHelper.dataSystem.url()
    client.post "services/sharing/", data, (err, res, body) ->
        if err?
            callback err
        else unless needSaving
            callback()
        else
            event.updateAttributes attendees: guests, callback
