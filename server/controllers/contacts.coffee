Contact = require '../models/contact'

module.exports.fetch = (req, res, next, id) ->
    Contact.find id, (err, contact) ->
        return res.send error: err, 500 if err
        return res.send error: 'Contact not found', 404 if not contact

        req.contact = contact
        next()

module.exports.list = (req, res) ->
    Contact.request 'all', (err, contacts) ->
        return res.send error: err, 500 if err
        res.send contacts

module.exports.read = (req, res) ->
    res.send req.contact