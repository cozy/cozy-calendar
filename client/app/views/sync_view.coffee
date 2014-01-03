BaseView = require '../lib/base_view'

module.exports = class ImportView extends BaseView

    id: 'viewContainer'
    template: require './templates/sync_view'
