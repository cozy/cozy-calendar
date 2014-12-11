Tag = require '../models/tag'

module.exports.fetch = (req, res, next, id) ->
    Tag.find id, (err, tag) ->
        if err or not tag
            acceptLanguage = req.headers['accept-language']
            if acceptLanguage?.indexOf('text/html') isnt -1
                res.send error: "Tag not found", 404
            else
                res.send "Tag not found: the tag is probably not created yet.",
                         404
        else
            req.tag = tag
            next()

module.exports.all = (req, res, next) ->
    Tag.all (err, results) ->
        return next err if err

        res.send 200, results

module.exports.read = (req, res) ->
    res.send req.tag

module.exports.create = (req, res) ->
    data = req.body
    Tag.create data, (err, tag) ->
        return res.error "Server error while creating tag." if err
        res.send tag, 201

module.exports.update = (req, res) ->
    data = req.body
    req.tag.updateAttributes data, (err, tag) ->
        if err?
            res.send error: "Server error while saving tag", 500
        else
            res.send tag, 200

module.exports.delete = (req, res) ->
    req.tag.destroy (err) ->
        if err?
            res.send error: "Server error while deleting the tag", 500
        else
            res.send success: true, 200
