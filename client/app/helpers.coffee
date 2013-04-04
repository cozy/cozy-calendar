exports.formatDateICal = (date) ->
    date = date.split(/[-:]/);
    dueDate = "#{date[0]}#{date[1]}#{date[2]}T" + \
              "#{date[3]}#{date[4]}00Z"

    return dueDate

exports.icalDateToObject = (date) ->
    date = date.split('T')

    formattedDate =
        year: date[0].slice 0, 4
        month: date[0].slice 4, 6
        day: date[0].slice 6, 8
        hour: date[1].slice 0, 2
        minute: date[1].slice 2, 4

    return formattedDate

exports.buildStandardDate = (dateObject) ->

    if not dateObject.hour
        dateObject.hour = "00"
    if not dateObject.minute
        dateObject.minute = "00"

    return "#{dateObject.year}/#{dateObject.month}/#{dateObject.day} " + \
           "#{dateObject.hour}:#{dateObject.minute}:00"