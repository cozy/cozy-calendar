cozydb = require 'cozydb'
log = require('printit')
    prefix: 'tag:model'

module.exports = Tag = cozydb.getModel 'Tag',
    name : type: String
    color : type: String

Tag.byName = (options, callback) ->
    Tag.request 'byName', options, callback

Tag.getOrCreateByName = (data, callback) ->
    # Name is a primary key.
    Tag.byName key: data.name, (err, tags)->
        if err
            log.error err
            Tag.create data, callback

        else if tags.length is 0
            Tag.create data, callback

        else # Tag already exists.
            callback null, tags[0]
