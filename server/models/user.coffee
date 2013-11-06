americano = require 'americano-cozy'

module.exports = User = americano.getModel 'User',
    email    : type : String
    timezone : type : String, default: "Europe/Paris"


User.all = (callback) ->
    User.request "all", callback

User.destroyAll = (callback) ->
    User.requestDestroy "all", callback

User.getTimezone = (callback) ->
    console.log "B1"
    User.all (err, users) ->
        console.log "B2"
        if err
            callback err
        else if users.length is 0
            callback new Error('no user')
        else
            callback null, users[0].timezone

User.updateTimezone = (callback) ->
    console.log "A"
    User.getTimezone (err, timezone) ->
        console.log "B"
        if err
            console.log err
            User.timezone = "Europe/Paris"
        else
            User.timezone = timezone or "Europe/Paris"
        callback?()