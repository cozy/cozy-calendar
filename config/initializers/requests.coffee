module.exports = (compound) ->
    #requests = require "../../common/requests"

    Alarm = compound.models.Alarm

    all = (doc) ->
        emit doc.title, doc

    Alarm.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request Alarm#All, cannot be created"
            compound.logger.write err