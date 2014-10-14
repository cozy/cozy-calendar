americano = require 'americano-cozy'

module.exports = User = americano.getModel 'User',
    email    : type : String
    timezone : type : String, default: "Europe/Paris"


User.all = (callback) ->
    User.request "all", callback

User.destroyAll = (callback) ->
    User.requestDestroy "all", callback

User.getUser = (callback) ->
    User.all (err, users) ->
        if err
            callback err
        else if users.length is 0
            callback new Error('no user')
        else
            callback null, users[0]

User.updateUser = (callback) ->
    User.getUser (err, user) ->
        if err
            console.log err
            User.timezone = 'Europe/Paris'
            User.email = ''
        else
            User.timezone = user.timezone or "Europe/Paris"
            User.email = user.email
        callback?()