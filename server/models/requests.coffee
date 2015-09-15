cozydb = require 'cozydb'

tagsView =
    map: (doc) ->
        doc.tags?.forEach? (tag, index) ->
            type = if index is 0 then 'calendar' else 'tag'
            emit [type, tag], true
    reduce: "_count"

module.exports =

    tag:
        byName       : cozydb.defaultRequests.by 'name'

    alarm:
        all       : cozydb.defaultRequests.all
        byDate    : (doc) -> emit new Date(doc.trigg), doc
        tags      : tagsView


    event:
        all       : cozydb.defaultRequests.all
        byDate    : (doc) -> emit new Date(doc.start), doc
        tags      : tagsView
        byCalendar: cozydb.defaultRequests.by 'tags[0]'

    contact:
        all       : cozydb.defaultRequests.all

    webdavaccount:
        all       : cozydb.defaultRequests.all
