ViewCollection = require '../lib/view_collection'
PopoverEvent = require './calendar_popover_event'

module.exports = class BucketView extends ViewCollection

    tagName: 'div'
    className: 'dayprogram'
    template: require './templates/list_view_bucket'
    itemview: require './list_view_item'
    collectionEl: '.alarms'

    events:
        'click .add': 'makeNew'

    initialize: ->
        @collection = @model.items
        super

    getRenderData: ->
        date: @model.get('date').format 'dddd LL'

    # @TODO : seems unplugged.
    makeNew: ->
        @showPopover
            type: 'event'
            start: @model.get('date').clone().set hour: 8, minute: 30
            end: @model.get('date').clone().set hour: 10, minute: 0
            target: @$('.add')

    # @TODO : unused, but also outdated (see calendar_view for popover api).
    showPopover: (options) ->
        options.parentView = this
        options.container = $ 'body'
        @popover.close() if @popover
        @popover = new PopoverEvent options
        @popover.render()

    getUrlHash: -> 'list'

    appendView: (view) ->
        index = @collection.indexOf view.model
        el = view.$el
        if index is 0 then @$collectionEl.prepend el
        else
            prevCid = @collection.at(index-1).cid
            @views[prevCid].$el.after el
