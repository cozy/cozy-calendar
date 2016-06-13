# Fix naming of ViewCollection Class to CollectionView
CollectionView = require 'lib/view_collection'
CollectionCounterView = require './collection_counter'
PopupView = require 'lib/popup_view'

module.exports = class PendingEventSharingsButtonView extends CollectionView

    id: 'shared-events-button'
    template: require('./templates/pending_event_sharings_button')
    itemview: require('./pending_event_sharings_button_item')
    collectionEl: '#shared-events-popup'


    events:
        'click button': 'togglePopup'
        'keyup': 'onKeyUp'


    initialize: (options)->
        super()

        @counterView = new CollectionCounterView
            collection: @collection

        @options = options


    togglePopup: (display) ->
        @popup and @popup.toggle()


    render: ->
        super
        @counterView.snap(@).render()


    afterRender: ->
        if @collection.length then @$el.show() else @$el.hide()

        super

        @popup = new PopupView
            el: @$ @collectionEl
            anchor: @$el
            document: @options.document


    addItem: (model) ->
        @$el.show()
        super model


    removeItem: (model) ->
        super model

        if @collection.length == 0
            @popup.hide()
            @$el.hide()


    onKeyUp: (event) ->
        keys = ESC: 27
        if event.keyCode is keys.ESC
            @withdraw


    withdraw: ->
        @togglePopup(false)
