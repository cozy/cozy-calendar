# Fix naming of ViewCollection Class to CollectionView
CollectionView = require 'lib/view_collection'

module.exports = class CollectionCounterView extends CollectionView

    className: 'collection-counter'
    template: require('./templates/collection_counter')


    initialize: (options) ->
        super options

        @stopListening @collection

        @listenTo @collection, 'add remove reset', @render

    afterRender: ->
