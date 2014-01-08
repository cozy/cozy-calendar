ScheduleItemsCollection = require './scheduleitems'
Event = require '../models/event'

module.exports = class EventCollection extends ScheduleItemsCollection

    model: Event
    url: 'events'