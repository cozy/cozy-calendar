ViewCollection = require '../lib/view_collection'
EventView = require './import_event_view'
EventCollection = require '../collections/events'

module.exports = class EventList extends ViewCollection

    itemview: EventView
    views: {}

    template: -> ''
    collection: new EventCollection
    collectionEl: "#import-event-list"
