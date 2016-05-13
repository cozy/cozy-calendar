BaseView = require 'lib/base_view'

module.exports = class PendingEventSharingsButtonItemView extends BaseView

    className: 'event-sharings-button-item'
    template: require './templates/pending_event_sharings_button_item'

    events:
        'click .accept': 'onAccept'
        'click .decline': 'onDecline'

    initialize: ->
        @listenTo @model, 'accepted refused', @destroy

    onAccept: ->
        @model.accept (err) =>
            if err
                @onAnswerError err


    onDecline: ->
        @model.refuse (err) =>
            if err
                @onAnswerError err

    onAnswerError: (err) ->
        console.error err
