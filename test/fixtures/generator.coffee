fs = require 'fs'
moment = require '../server/libs/moment'

# Return a random number between 0 and `max` (included).
getRandom = (max) -> Math.round Math.random() * max
getRandomElmt = (array) -> array[getRandom(array.length - 1)]

eventsNum = process.argv[2] or 500
calendarName = process.argv[3] or 'default calendar'

events = []

# Initial value to generate dates.
today = moment()
year = today.year()


for j in [0..eventsNum - 1] by 1

    # Month is between 1 and 12.
    month = getRandom(11) + 1

    # Day is between 1 and 31. If there is less day then `day` in the month,
    # it will bubble up to the next month.
    day = getRandom(30) + 1

    # Hour is between 0 and 23.
    hour = getRandom(23)

    # Minute is 0 or 30.
    minute = getRandomElmt [0, 30]

    start = moment(today)
        .month(month)
        .day(day)
        .hour(hour)
        .minute(minute)
        .second(0)
        .millisecond(0)

    end = moment(start).add(2, 'hours')

    events.push
        start: start.toISOString()
        end: end.toISOString()
        place: ''
        description: "Event n°#{j}"
        details: ''
        tags: [calendarName]
        rrule: ''
        created: new Date().toISOString()
        lastModification:  new Date().toISOString()
        docType: 'Event'


targetFile = './test/fixtures/events_generated.json'
json = JSON.stringify events, null, '  '
fs.writeFile targetFile, json, flag: 'w+', (err) ->
    console.log err if err?
    console.log "Done generating #{eventsNum} events."

