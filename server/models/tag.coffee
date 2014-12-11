americano = require 'americano-cozy'
log = require('printit')
    prefix: 'tag:model'

module.exports = Tag = americano.getModel 'Tag',
    name : type: String
    color : type: String

Tag.byName = (name, callback) ->
    Tag.request 'all', key: name, callback
