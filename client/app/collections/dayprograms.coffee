{CozyCollection} = require '../lib/cozy_collection'
{DayProgram} = require '../models/dayprogram'

class exports.DayProgramCollection extends CozyCollection

    model: DayProgram

    comparator: (dayProg1, dayProg2) ->

        d1 = dayProg1.getDateObject()
        d2 = dayProg2.getDateObject()

        if d1.getTime() < d2.getTime()
            return -1
        else if d1.getTime() is d2.getTime()
            return 0
        else
            return 1