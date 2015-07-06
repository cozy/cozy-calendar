cozydb = require 'cozydb'
log = require('printit')
    prefix: 'tag:model'

module.exports = Tag = cozydb.getModel 'Tag',
    name : type: String
    color : type: String

Tag.byName = (name, callback) ->
    Tag.request 'byName', key: name, callback

Tag.getOrCreate = (data, callback) ->
    # Name is a primary key.
    Tag.byName data.name, (err, tags)->
        if err
            log.error err
            Tag.create data, callback

        else if tags.length is 0
            Tag.create data, callback

        else # Tag already exists.
            callback null, tags[0]
