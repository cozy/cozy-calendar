americano = require 'americano-cozy'

tagsView =
    map    : (doc) ->
        doc.tags?.forEach? (tag, index) ->
            type = if index is 0 then 'calendar' else 'tag'
            emit [type, tag], true
    reduce : (key, values, rereduce) -> true

module.exports =

    alarm:
        all       : (doc) -> emit doc.title, doc
        byDate    : (doc) -> emit new Date(doc.trigg), doc
        tags      : tagsView


    event:
        all       : (doc) -> emit doc.title, doc
        byDate    : (doc) -> emit new Date(doc.start), doc
        tags      : tagsView

    user:
        all       : (doc) -> emit doc.title, doc

    contact:
        all       : americano.defaultRequests.all

    cozy_instance:
        all       : americano.defaultRequests.all