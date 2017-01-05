cozydb = require 'cozydb'
log = require('printit')
    prefix: 'tag:settings'

# Object used to store the user settings such as the default calendar used for
# event creation.
module.exports = Settings = cozydb.getModel 'Settings',
    app: String
    defaultCalendar: String

# Return the settings object for the Calendar application. It creates it if it
# doesn't exist.
Settings.getCalAppSettings = (callback) ->
    Settings.request 'all', (err, allSettings) ->
        return callback err if err

        # TODO use lodash find here
        allSettings = allSettings.filter (settings) ->
            settings.app is 'calendar'

        if allSettings.length is 0
            calendarSettings =
                app: 'calendar'
                defaultCalendar: ''
            Settings.create calendarSettings, (err, calendarSettings) ->
                return callback err if err
                callback null, calendarSettings

        else
            callback null, allSettings[0]

# Change calendar settings values.
Settings.updateCalAppSettings = (data, callback) ->
    newSettings =
        defaultCalendar: data.defaultCalendar

    Settings.getCalAppSettings (err, calendarSettings) ->
        return callback(err) if err

        calendarSettings.updateAttributes(
            newSettings,
            (err, calendarSettings) ->
                return callback(err) if err
                callback(null, calendarSettings)
        )

