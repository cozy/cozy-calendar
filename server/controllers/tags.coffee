Tag = require '../models/tag'


module.exports.fetch = (req, res, next, id) ->
    Tag.find id, (err, tag) ->
        if err or not tag
            res.send error: "Tag not found", 404
        else
            req.tag = tag
            next()


module.exports.all = (req, res, next) ->
    Tag.byName (err, results) ->
        return next err if err

        res.status(200).send results


module.exports.read = (req, res) ->
    res.send req.tag


module.exports.create = (req, res) ->
    data = req.body
    Tag.getOrCreate data, (err, tag) ->
        if err?
            res.send error: "Server error while creating tag.", 500
        else
            res.status(201).send tag


module.exports.update = (req, res) ->
    data = req.body
    req.tag.updateAttributes data, (err, tag) ->
        if err?
            res.send error: "Server error while saving tag", 500
        else
            res.status(200).send tag


module.exports.delete = (req, res) ->
    req.tag.destroy (err) ->
        if err?
            res.status(500).send error: "Server error while deleting the tag"
        else
            res.status(200).send success: true

