BaseView = require '../lib/base_view'

module.exports = class GuestView extends BaseView

    template: require './templates/event_modal_guest'

    events:
        'click .remove-guest': 'onRemoveGuest'

    onRemoveGuest: ->
        @model.collection.remove @model
