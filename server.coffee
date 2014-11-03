#!/usr/bin/env coffee

start = (port, callback) ->
    require('americano').start
            name: 'Calendar'
            port: port
            host: process.env.HOST or "0.0.0.0"
            root: __dirname
    , (app, server) ->
        

        User = require './server/models/user'
        Realtimer = require('cozy-realtime-adapter')
        realtime = Realtimer server : server, ['alarm.*', 'event.*']
        realtime.on 'user.*', -> User.updateUser()
        User.updateUser (err) ->
            callback err, app, server

        # Migration scripts. Relies on User.
        Event = require './server/models/event'
        Event.migrateAll()

        Alarm = require './server/models/alarm'
        Alarm.migrateAll()

if not module.parent
    port = process.env.PORT or 9113
    start port, (err) ->
        if err
            console.log "Initialization failed, not starting"
            console.log err.stack
            process.exit 1
else
    module.exports = start
