View = require '../lib/view'
AlarmFormView = require './alarmform_view'
AlarmsListView = require '../views/alarmsList_view'

module.exports = class CalendarView extends View

    el: '#viewContainer'

    initialize: ->
        console.log "calendar !"

    template: ->
        require('./templates/home')

    afterRender: ->
        @alarmsListView = new AlarmsListView
           model: @model