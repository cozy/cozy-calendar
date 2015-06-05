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


User.getUserInfos = (callback) ->
    cozydb.api.getCozyUser (err, user) ->
        return callback err if err

        name = if user.public_name?.length
            user.public_name
        else
            words = user.email.split('@')[0]
                        .replace '.', ' '
                        .replace '-', ' '
                        .split ' '
            words.map((word) -> word[0].toUpperCase() + word[1...]).join ' '

        callback null,
            name:  name
            email: user.email
