americano = require 'americano-cozy'

module.exports =

    alarm:
        all       : (doc) -> emit doc.title, doc
        byDate    : (doc) -> emit new Date(doc.trigg), doc

    event:
        all       : (doc) -> emit doc.title, doc
        byDate    : (doc) -> emit new Date(doc.start), doc

    user:
        all       : (doc) -> emit doc.title, doc

    contact:
        all       : americano.defaultRequests.all

    cozy_instance:
        all       : americano.defaultRequests.all