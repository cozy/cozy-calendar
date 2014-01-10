BaseView = require '../lib/base_view'

module.exports = class ImportView extends BaseView

    id: 'view-container'
    template: require './templates/sync_view'
