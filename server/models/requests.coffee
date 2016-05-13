cozydb = require 'cozydb'

tagsView =
    map: (doc) ->
        if not doc.shareID
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
        reccuring : (doc) ->
            emit doc.id, doc if doc.rrule? and doc.rrule.length > 0
        tags      : tagsView
        byCalendar: cozydb.defaultRequests.by 'tags[0]'

    contact:
        all       : cozydb.defaultRequests.all

    webdavaccount:
        all       : cozydb.defaultRequests.all

    sharing:
        all       : cozydb.defaultRequests.all
        pendingBySharedDocType: (doc) ->
            if not doc.accepted && not doc.targets && doc.rules
                doc.rules.forEach (rule) ->
                    emit(rule.docType, doc)
