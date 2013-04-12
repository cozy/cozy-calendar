exports.formatDateICal = (date) ->
    date = date.split(/[/:]/);
    dueDate = "#{date[2]}#{date[1]}#{date[0]}T" + \
              "#{date[3]}#{date[4]}00Z"

    return dueDate

exports.isICalDateValid = (date) ->

    return false unless date.match(/[0-9]{8}T[0-9]{6}Z/)

    date = new XDate(exports.icalToISO8601(date))

    return date.valid()


exports.icalToISO8601 = (icalDate, localOffset) ->

    localOffset = '' unless localOffset?

    date = icalDate.split('T')

    year = date[0].slice 0, 4
    month = date[0].slice 4, 6
    day = date[0].slice 6, 8
    hours = date[1].slice 0, 2
    minutes = date[1].slice 2, 4

    return "#{year}-#{month}-#{day}T#{hours}:#{minutes}#{localOffset}"