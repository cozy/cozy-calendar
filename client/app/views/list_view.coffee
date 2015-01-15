ViewCollection      = require '../lib/view_collection'
Header              = require 'views/calendar_header'
helpers = require '../helpers'
defaultTimezone = 'timezone'


module.exports = class ListView extends ViewCollection

    id: 'view-container'
    template: require './templates/list_view'
    itemview: require './list_view_bucket'
    collectionEl: '#alarm-list'
    events:
        'click .showafter': 'loadAfter'
        'click .showbefore': 'loadBefore'

    afterRender: ->
        @calHeader = new Header()
        @$('#calheader').html @calHeader.render().$el
        @calHeader.on 'month', -> app.router.navigate '', trigger:true
        @calHeader.on 'week', -> app.router.navigate 'week', trigger:true

        @$('#list-container').scroll @checkScroll
        @keepScreenFull()
        @collection.on 'reset', @keepScreenFull
        super

    appendView: (view) ->
        index = @collection.indexOf view.model
        el = view.$el

        if index is 0 then @$(@collectionEl).prepend el
        else
            prevCid = @collection.at(index-1).cid
            if prevCid of @views
                @views[prevCid].$el.after el
            else # previous not present, insert in place
                prevView = _.values(@views).reduce (previous, current) ->
                    dCurrent = view.model.get('date').diff current.model.date
                    if dCurrent < 0
                        return previous

                    else if previous?
                        dPrevious = view.model.get('date').diff previous.model.date
                        return if dCurrent < dPrevious then current else previous
                    else
                        return current
                if prevView?
                    prevView.$el.after el
                else
                    @$(@collectionEl).prepend el

    keepScreenFull: =>
        list = @$('#list-container')[0]
        if list.scrollHeight <= list.clientHeight
            @loadAfter()

    checkScroll: =>
        triggerPoint = 100 # 100px from the bottom
        list = @$('#list-container')[0]
        if list.scrollTop + list.clientHeight + triggerPoint > list.scrollHeight
            @loadAfter()

    loadBefore: ->
        if not @isLoading
            @isLoading = true
            @collection.loadPreviousPage =>
                @isLoading = false

    loadAfter: ->
        if not @isLoading
            @isLoading = true
            @collection.loadNextPage =>
                @isLoading = false
