BaseView = require '../lib/base_view'
ImportView = require './import_view'

module.exports = class SyncView extends BaseView

    id: 'view-container'
    template: require './templates/sync_view'

    afterRender: ->
        @$('#importviewplaceholder').append new ImportView().render().$el