ScheduleItemsCollection = require './scheduleitems'

DayBucket = class DayBucket extends Backbone.Model
    constructor: (model) ->
        super
            id: model.getDateHash()
            date: model.getDateObject().startOf 'day'
    initialize: ->
        @items = new ScheduleItemsCollection()

# DayBucket Collection
# mix alarms & events into one collection
# split into DayBucket (= group by day)
module.exports = class DayBucketCollection extends Backbone.Collection

    model: DayBucket
    comparator: 'date'

    initialize: ->
        @alarmCollection = app.alarms
        @eventCollection = app.events
        @tagsCollection = app.tags

        @listenTo @alarmCollection, 'add', @onBaseCollectionAdd
        @listenTo @alarmCollection, 'change:trigg', @onBaseCollectionChange
        @listenTo @alarmCollection, 'remove', @onBaseCollectionRemove
        @listenTo @alarmCollection, 'reset', @resetFromBase

        @listenTo @eventCollection, 'add', @onBaseCollectionAdd
        @listenTo @eventCollection, 'change:start', @onBaseCollectionChange
        @listenTo @eventCollection, 'remove', @onBaseCollectionRemove
        @listenTo @eventCollection, 'reset', @resetFromBase

        @listenTo @tagsCollection, 'change', @resetFromBase

        @resetFromBase()

    resetFromBase: ->
        @reset []
        @alarmCollection.each (model) => @onBaseCollectionAdd model
        @eventCollection.each (model) => @onBaseCollectionAdd model

    onBaseCollectionChange: (model) ->
        oldbucket = @get model.getPreviousDateHash()
        newbucket = @get model.getDateHash()
        return if oldbucket is newbucket
        oldbucket.items.remove model
        @remove oldbucket if oldbucket.items.length is 0
        @add(newbucket = new DayBucket model) unless newbucket
        newbucket.items.add model

    onBaseCollectionAdd: (model) ->
        bucket = @get model.getDateHash()

        tag = @tagsCollection.findWhere label: model.getCalendar()
        return null if tag and tag.get('visible') is false

        @add(bucket = new DayBucket model) unless bucket
        bucket.items.add model

    onBaseCollectionRemove: (model) ->
        bucket = @get model.getDateHash()
        bucket.items.remove model
        @remove bucket if bucket.items.length is 0

