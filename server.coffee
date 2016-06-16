#!/usr/bin/env coffee

start = (port, callback) ->
    require('americano').start
        name: 'Calendar'
        port: port
        host: process.env.HOST or "0.0.0.0"
        root: __dirname
    , (err, app, server) ->
        require 'cozydb'
        User = require './server/models/user'
        Realtimer = require 'cozy-realtime-adapter'
        localization = require 'cozy-localization-manager'
        localizationManager = localization.getInstance()
        realtime = Realtimer server, ['event.*', 'contact.*', 'sharing.*']
        realtime.on 'user.*', -> User.updateUser()

        # Update localization engine if the language changes.
        updateLocales = localizationManager.realtimeCallback
                        .bind(localizationManager)
        realtime.on 'cozyinstance.*', updateLocales

        User.updateUser (err) ->
            # Migration scripts. Relies on User.
            Event = require './server/models/event'
            Alarm = require './server/models/alarm'
            Event.migrateAll -> Alarm.migrateAll ->

                Event.initializeData (err2) ->
                    callback err or err2, app, server


console.log "env", process.env

if not module.parent
    port = process.env.PORT or 9113
    start port, (err) ->
        if err
            console.log "Initialization failed, not starting"
            console.log err.stack
            process.exit 1
else
    module.exports = start
