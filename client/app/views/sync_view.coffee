BaseView = require '../lib/base_view'
ImportView = require './import_view'
ComboBox = require './widgets/combobox'

module.exports = class SyncView extends BaseView

    id: 'view-container'
    template: require './templates/sync_view'

    events:
        'click a#export': 'exportCalendar'
        'click #show-password': 'showPassword'
        'click #hide-password': 'hidePassword'

    getRenderData: ->
        account: @model

    initialize: ->
        @model = window.webDavAccount
        if @model?
            @model.placeholder = @getPlaceholder @model.token

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

    # creates a placeholder for the password
    getPlaceholder: (password) ->
        placeholder = []
        placeholder.push '*' for i in [1..password.length] by 1
        return placeholder.join ''

    showPassword: ->
        @$('#placeholder').html @model.token
        @$('#show-password').hide()
        @$('#hide-password').show()

    hidePassword: ->
        @$('#placeholder').html @model.placeholder
        @$('#hide-password').hide()
        @$('#show-password').show()
