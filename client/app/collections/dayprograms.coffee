{CozyCollection} = require '../lib/cozy_collection'
{DayProgram} = require '../models/dayprogram'

class exports.DayProgramCollection extends CozyCollection

    model: DayProgram

    comparator: (dp1, dp2) ->

        d1 = dp1.getStandardDate()
        d2 = dp2.getStandardDate()

        if d1.getTime() < d2.getTime()
            return -1
        else if d1.getTime() is d2.getTime()
            return 0
        else
            return 1