ViewCollection = require '../lib/view_collection'
EventView = require './import_event_view'
EventCollection = require '../collections/events'

module.exports = class EventList extends ViewCollection

    itemview: EventView
    collection: new EventCollection()
