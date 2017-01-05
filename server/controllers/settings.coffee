Settings = require '../models/settings'


module.exports =

    # Get the setting object and update it with given values. Currently, only
    # the default calendar parameter is handled.
    update: (req, res, next) ->
        req.checkBody
            defaultCalendar:
                notEmpty: true
                isString: true
                errorMessage: 'Invalid calendar name'
        req.getValidationResult().then (result) ->
            if not result.isEmpty()
                responseBody =
                    success: false
                    error: result.array()
                return res.status(400).send(responseBody)

            newSettings =
                defaultCalendar: req.body.defaultCalendar

            Settings.updateCalAppSettings newSettings, (err, calSettings) ->
                return next err if err

                res.send
                    success: true
                    settings: calSettings
