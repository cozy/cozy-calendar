exports.formatDateICal = (fullDate) ->

    fullDate = fullDate.split /#/

    date = fullDate[0].split /[\/]/
    if date.length is 3
        date = "#{date[2]}#{date[1]}#{date[0]}"
    else
        date = "undefined"

    time = fullDate[1].split /:/
    if time.length is 2
        time = "#{time[0]}#{time[1]}00"
    else
        time = "undefined"

    return "#{date}T#{time}Z"

exports.isICalDateValid = (date) ->

    return false unless date.match(/[0-9]{8}T[0-9]{6}Z/)

    date = new XDate(exports.icalToISO8601(date))

    return date.valid()

exports.isDatePartValid = (date) ->
    date = date.split('T')
    return date[0].match(/[0-9]{8}/)?

exports.isTimePartValid = (date) ->
    date = date.split('T')
    return date[1].match(/[0-9]{6}Z/)?


exports.icalToISO8601 = (icalDate, localOffset) ->

    localOffset = '' unless localOffset?

    date = icalDate.split('T')

    year = date[0].slice 0, 4
    month = date[0].slice 4, 6
    day = date[0].slice 6, 8
    hours = date[1].slice 0, 2
    minutes = date[1].slice 2, 4

    return "#{year}-#{month}-#{day}T#{hours}:#{minutes}#{localOffset}"