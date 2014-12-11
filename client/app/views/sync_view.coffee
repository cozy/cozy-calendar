BaseView = require '../lib/base_view'
ImportView = require './import_view'
ComboBox = require './widgets/combobox'

module.exports = class SyncView extends BaseView

    id: 'view-container'
    template: require './templates/sync_view'

    events:
        'click a#export': 'exportCalendar'

    afterRender: ->
        @calendar = new ComboBox
            el: @$('#export-calendar')
            source: app.calendars.toAutoCompleteSource()

        @$('#importviewplaceholder').append new ImportView().render().$el

    exportCalendar: ->
        calendarId = @calendar.value()
        if calendarId in app.calendars.toArray()
            window.location = "export/#{calendarId}.ics"

        else
            alert t 'please select existing calendar'
