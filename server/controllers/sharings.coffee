Sharing = require '../models/sharing'

module.exports.all = (req, res) ->
    Sharing.pendingBySharedDocType 'event', (err, sharings)->
        if err
            res.status(500).send error: err
        else
            res.send sharings


module.exports.fetch = (req, res, next, id) ->
    Sharing.find id, (err, sharing) ->
        if err or not sharing
            res.status(400).send error: "Sharing not found"
        else
            req.sharing = sharing
            next()


module.exports.read = (req, res) ->
    res.send req.sharing


module.exports.accept = (req, res) ->
    data = req.body
    id = data.id

    Sharing.accept id, (err, response) ->
        if err
            res.status(500).send error: err
        else
            res.send data


module.exports.refuse = (req, res) ->
    data = req.body
    id = data.id

    Sharing.accept id, (err, response) ->
        if err
            res.status(500).send error: err
        else
            res.status(204).send data
