module.exports = (compound, Reminder) ->

    Reminder.all = (params, callback) ->
        Reminder.request "all", params, callback