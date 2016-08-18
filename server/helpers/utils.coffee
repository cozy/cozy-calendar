client = require './client'
log    = require('printit')
    prefix: "utils"
    date  : true


module.exports.exist = (req, res) ->
    id = req.params.id

    client.get "data/exist/#{id}/", (error, response, body) ->
        if error
            res.status(500).send error
        else if not body? or not body.exist?
            res.status(500).send new Error "Data system returned invalid data."
        else
            res.status(200).send body.exist

