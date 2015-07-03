#!/usr/bin/env coffee

start = (port, callback) ->
    require('americano').start
            name: 'Calendar'
            port: port
            host: process.env.HOST or "0.0.0.0"
            root: __dirname
    , (app, server) ->


        User = require './server/models/user'
        localization = require './server/libs/localization_manager'
        Realtimer = require 'cozy-realtime-adapter'
        realtime = Realtimer server, ['event.*']
        realtime.on 'user.*', -> User.updateUser()
        User.updateUser (err) -> localization.initialize ->
            # Migration scripts. Relies on User.
            Event = require './server/models/event'
            Alarm = require './server/models/alarm'
            Event.migrateAll -> Alarm.migrateAll ->

                Event.initializeData (err2, event) ->
                    callback err, app, server


if not module.parent
    port = process.env.PORT or 9113
    start port, (err) ->
        if err
            console.log "Initialization failed, not starting"
            console.log err.stack
            process.exit 1
else
    module.exports = start
