ScheduleItemsCollection = require './scheduleitems'
Alarm = require '../models/alarm'

module.exports = class AlarmCollection extends ScheduleItemsCollection

    model: Alarm
    url: 'alarms'


