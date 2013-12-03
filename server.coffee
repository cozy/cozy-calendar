#!/usr/bin/env coffee

start = (port, callback) ->
    require('americano').start
            name: 'Agenda'
            port: port
            host: process.env.HOST or "127.0.0.1"
    , (app, server) ->
        app.set 'views', './client/'

        User = require './server/models/user'
        Realtimer = require('cozy-realtime-adapter')
        realtime = Realtimer server : server, ['alarm.*', 'event.*']
        realtime.on 'user.*', -> User.updateTimezone()
        User.updateTimezone (err) ->
            callback err, app, server

if not module.parent
    port = process.env.PORT or 9114
    start port, (err) ->
        if err
            console.log "Initialization failed, not starting"
            console.log err.stack
            process.exit 1
else
    module.exports = start