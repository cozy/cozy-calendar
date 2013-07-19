ViewCollection = require '../lib/view_collection'
AlarmView = require './import_alarm_view'
AlarmCollection = require '../collections/alarms'

module.exports = class AlarmList extends ViewCollection

    itemview: AlarmView
    views: {}

    template: -> ''
    collection: new AlarmCollection
    collectionEl: "#import-alarm-list"
