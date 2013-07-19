CozyCollection = require '../lib/cozy_collection'

module.exports = class ScheduleItemsCollection extends CozyCollection

    comparator: (si1, si2) ->

        d1 = si1.getDateObject()
        d2 = si2.getDateObject()

        if d1.getTime() < d2.getTime()
            return -1
        else if d1.getTime() is d2.getTime()
            return 0
        else
            return 1