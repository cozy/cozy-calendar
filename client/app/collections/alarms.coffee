{CozyCollection} = require '../lib/cozy_collection'
{Alarm} = require '../models/alarm'

class exports.AlarmCollection extends CozyCollection

    model: Alarm

    comparator: (alarm1, alarm2) ->

        d1 = alarm1.getStandardDate()
        d2 = alarm2.getStandardDate()

        if d1.getTime() < d2.getTime()
            return -1
        else if d1.getTime() is d2.getTime()
            return 0
        else
            return 1


