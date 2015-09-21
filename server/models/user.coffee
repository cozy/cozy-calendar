cozydb = require 'cozydb'

module.exports = User = {}

User.updateUser = (callback) ->
    cozydb.api.getCozyUser (err, user) ->
        if err or not user
            console.log err if err
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
            # - Get first part of mail
            # - Replace '.' and '-' with space
            # - Split on spaces
            # - Capitalize string
            words = user.email.split('@')[0]
                        .replace /([\.-]+)/g, ' '
                        .split ' '
            words.map((word) -> word[0].toUpperCase() + word[1...]).join ' '

        callback null,
            name:  name
            email: user.email
