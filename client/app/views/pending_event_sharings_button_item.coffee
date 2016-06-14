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
        @$errors = @$errors ?= @$ '.errors'
        @$errors.html t 'An error occurred. Please try again later.'
        @setNotBusy()
        @setInvalid()
        @enable()
