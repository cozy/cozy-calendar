CozyCollection = require '../lib/cozy_collection'
Alarm = require '../models/alarm'

module.exports = class AlarmCollection extends CozyCollection

    model: Alarm
    url: 'alarms'

    comparator: (alarm1, alarm2) ->

        d1 = alarm1.getDateObject()
        d2 = alarm2.getDateObject()

        if d1.getTime() < d2.getTime()
            return -1
        else if d1.getTime() is d2.getTime()
            return 0
        else
            return 1


