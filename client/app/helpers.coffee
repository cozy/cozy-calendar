exports.formatDateISO8601 = (fullDate) ->

    fullDate = fullDate.split /#/

    if fullDate[0].match(/([0-9]{2}\/){2}[0-9]{4}/)
        date = fullDate[0].split /[\/]/
        date = "#{date[2]}-#{date[1]}-#{date[0]}"
    else
        date = "undefined"

    if fullDate[1].match(/[0-9]{2}:[0-9]{2}/)
        time = fullDate[1].split /:/
        time = "#{time[0]}:#{time[1]}:00"
    else
        time = "undefined"

    return "#{date}T#{time}"


exports.isDatePartValid = (date) ->
    date = date.split('T')
    return date[0].match(/[0-9]{8}/)?


exports.isTimePartValid = (date) ->
    date = date.split('T')
    return date[1].match(/[0-9]{6}Z/)?


exports.icalToISO8601 = (icalDate) ->
    date = icalDate.split('T')

    year = date[0].slice 0, 4
    month = date[0].slice 4, 6
    day = date[0].slice 6, 8
    hours = date[1].slice 0, 2
    minutes = date[1].slice 2, 4

    return "#{year}-#{month}-#{day}T#{hours}:#{minutes}Z"


exports.isEvent = (start, end) ->
    if start[0] is end[0]
        if start[1] is "00" and end[1] is "30"
            return false
    else if parseInt(start[0])+1 is parseInt(end[0]) and start[1] is "30" and
            end[1] is "00"
        return false
    else
        return true


# Convert an ambiguously fullcalendar moment, to a timezoned moment.
# Use Cozy's timezone as reference. 
# Fullcalendar should use timezone = "Cozy's timezone" to be coherent.
exports.ambiguousToTimezoned = (ambigM) ->
    return moment.tz ambigM, window.app.timezone

exports.momentToAmbiguousString = (m) ->
    m.format 'YYYY-MM-DD[T]HH:mm:ss'

exports.momentToDateString = (m) ->
    m.format 'YYYY-MM-DD'

# Transform the unit/value object to a iCal duration string.
# @param unitsValues { 'M': 15, 'H': 1 ...}
exports.unitValuesToiCalDuration = (unitsValues) ->
    s = '-P'
    for u in ['W', 'D']
        if u of unitsValues
            s += unitsValues[u] + u

    t = ''
    for u in ['H', 'M', 'S']
        if u of unitsValues
            t += unitsValues[u] + u
    
    if t
        s += 'T' + t

    return s

# Handle only unique units strings.
exports.iCalDurationToUnitValue = (s) ->
    m = s.match(/(\d+)(W|D|H|M|S)/)
    o = {}
    o[m[2]] = m[1]

    return o

# Convert any date parsable by moment to a moment with cozy's timezone.
# CAUTION depend on
exports.toTimezonedMoment = (d) -> moment.tz d, window.app.timezone