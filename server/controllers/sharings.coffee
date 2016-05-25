Sharing = require '../models/sharing'

module.exports.all = (req, res) ->
    data = req.query
    if data.shareID
        Sharing.byShareID data.shareID, (err, sharings) ->
            if err
                res.status(500).send error: "Server error occured"
            else
                res.send sharings[0]
    else
        Sharing.all (err, sharings)->
            if err
                res.status(500).send error: err
            else
                res.send sharings


module.exports.fetch = (req, res, next, id) ->
    Sharing.find id, (err, sharing) ->
        if err
            res.status(500).send error: "Server error occured"
         else if not sharing
            res.status(404).send error: "Sharing not found"
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

    Sharing.refuse id, (err, response) ->
        if err
            res.status(500).send error: err
        else
            res.status(204).send data
