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


exports.getPopoverDirection = (isDayView, startDate) ->
    unless isDayView
        selectedWeekDay = startDate.format('{weekday}')
        if selectedWeekDay in ['friday', 'saturday', 'sunday']
            direction = 'left'
        else
            direction = 'right'
    else
        selectedHour = startDate.format('{HH}')
        if selectedHour >= 4
            direction = 'top'
        else
            direction = 'bottom'
    direction

exports.getDiffDays = (start, end) ->
    days = [31,28,31,30,31,30,31,31,30,31,30,31]

    monthDiff = () ->
        firstMonth = days[start[1]-1] - start[2]
        lastMonth = end[2]
        if end[1] - start[1] is 1   
            console.log parseInt(firstMonth)+parseInt(lastMonth)
            return parseInt(firstMonth)+parseInt(lastMonth)
        else
            diff = parseInt(firstMonth)+parseInt(lastMonth) 
            for i in [start[1]..end[1]-1] by 1
                diff = diff + days[i-1]
            console.log diff
            return diff

    if start is end
        return 0
    else if start[0] is end[0] and start[1] is end[1]
        return parseInt(end[2])-parseInt(start[2])
    else if start[0] is end[0]
        return monthDiff()
    else
        if end[1] - start[1] is 1
            return monthDiff()
        else
            diff = monthDiff()
            for i in [start[2]..end[2]-1] by 1
                diff = diff + 365
            return diff



