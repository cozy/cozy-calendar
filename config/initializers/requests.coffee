module.exports = (compound) ->
    #requests = require "../../common/requests"

    Reminder = compound.models.Reminder

    all = (doc) ->
        emit doc.title, doc

    Reminder.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Reminders All requests, cannot be created"
            compound.logger.write err