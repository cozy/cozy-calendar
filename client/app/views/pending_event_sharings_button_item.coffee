BaseView = require 'lib/base_view'

class PendingEventSharingsButtonItemView extends BaseView

    className: 'event-sharings-button-item'
    template: require './templates/pending_event_sharings_button_item'

    events:
        'click .accept': 'onAccept'
        'click .decline': 'onDecline'

    initialize: ->
        @listenTo @model, 'accepted refused', @destroy


    onAccept: ->
        @disable()
        @setBusy()
        @model.accept (err) =>
            if err
                @onAnswerError err
            else
                @onAnswerSuccess()


    onDecline: ->
        @disable()
        @setBusy()
        @model.refuse (err) =>
            if err
                @onAnswerError err
            else
                @onAnswerSuccess()


    onAnswerSuccess: ->
        @setValid()
        @remove()


    onAnswerError: (err) ->
        console.error err
        @$errors ?= @$ '.errors'
        @$errors.html t 'An error occurred. Please try again later.'
        @setNotBusy()
        @setInvalid()
        @enable()

module.exports = PendingEventSharingsButtonItemView
