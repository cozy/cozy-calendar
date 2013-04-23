module.exports = (compound) ->

    Alarm = compound.models.Alarm
    User = compound.models.User

    all = (doc) ->
        emit doc.title, doc

    Alarm.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request Alarm#All, cannot be created"
            compound.logger.write err

    User.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request User#All, cannot be created"
            compound.logger.write err