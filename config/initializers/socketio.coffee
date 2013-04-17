module.exports = (compound) ->

    sio = require 'socket.io'
    compound.io = sio.listen compound.server

    compound.io.set 'log level', 2
    compound.io.set 'transports', ['websocket']

    redis = require 'redis'
    client = redis.createClient()
    console.log ' socket.io initialized !'
    client.on 'pmessage', (pat, ch, msg) ->
        console.log pat, ch, msg
        compound.io.sockets.emit ch, msg

    client.psubscribe 'alarm.*'