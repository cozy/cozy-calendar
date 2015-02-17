cozydb = require 'cozydb'

module.exports = User = {}

User.updateUser = (callback) ->
    cozydb.api.getCozyUser (err, user) ->
        if err or not user
            console.log err
            User.timezone = 'Europe/Paris'
            User.email = ''
        else
            User.timezone = user.timezone or "Europe/Paris"
            User.email = user.email
        callback?()