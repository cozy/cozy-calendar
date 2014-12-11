RealEventCollection = require './realevents'
RealEventGeneratorCollection = require './realeventsgenerator'

DayBucket = class DayBucket extends Backbone.Model
    constructor: (model) ->
        super
            id: model.getDateHash()
            date: moment(model.start).startOf 'day'
    initialize: ->
        @items = new RealEventCollection()

# DayBucket Collection
# split into DayBucket (= group by day)
module.exports = class DayBucketCollection extends Backbone.Collection

    model: DayBucket
    comparator: 'date'

    initialize: ->
        @eventCollection = new RealEventGeneratorCollection()

        @calendarsCollection = app.calendars

        @listenTo @eventCollection, 'add', @onBaseCollectionAdd
        @listenTo @eventCollection, 'change:start', @onBaseCollectionChange
        @listenTo @eventCollection, 'remove', @onBaseCollectionRemove
        @listenTo @eventCollection, 'reset', @resetFromBase

        @listenTo @calendarsCollection, 'change', @resetFromBase


        @resetFromBase()

    resetFromBase: ->
        @reset []
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

        calendar = model.getCalendar()
        return null if calendar and calendar.get('visible') is false

        @add(bucket = new DayBucket model) unless bucket
        bucket.items.add model

    onBaseCollectionRemove: (model) ->
        bucket = @get model.getDateHash()
        bucket.items.remove model
        @remove bucket if bucket.items.length is 0

    loadNextPage: (callback) -> @eventCollection.loadNextPage callback

    loadPreviousPage: (callback) -> @eventCollection.loadPreviousPage callback
