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

        @collection.on 'reset', =>
            @$('.showafter').show()
            @$('.showbefore').show()
            @lastAlreadyLoaded = false
            @keepScreenFull()

        super

        @keepScreenFull()

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
                        dPrev = view.model.get('date').diff previous.model.date
                        return if dCurrent < dPrev then current else previous
                    else
                        return current
                if prevView?
                    prevView.$el.after el
                else
                    @$(@collectionEl).prepend el

    keepScreenFull: =>
        list = @$('#list-container')[0]
        if list.scrollHeight <= @el.clientHeight
            @loadAfter @keepScreenFull # infinite loop end by @lastAlreadyLoaded

    checkScroll: =>
        triggerPoint = 150 # 100px from the bottom
        list = @$('#list-container')[0]
        if list.scrollTop + list.clientHeight + triggerPoint > list.scrollHeight
            @loadAfter @checkScroll

    loadBefore: (callback)->
        if not @isLoading
            @isLoading = true
            button = @$('.showbefore')
            button.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
            button.spin 'tiny'
            # make asynchronous to allow the spinner to show up, before heavy
            # call on loadPreviousPage block the UI for à while.
            setTimeout =>
                @collection.loadPreviousPage (noMoreEvents) =>
                    if noMoreEvents
                        button.hide()
                    button.html t('display previous events')
                    button.spin 'none'
                    @isLoading = false
                    callback?()
            , 1

    loadAfter: (callback) ->
        if not @isLoading and not @lastAlreadyLoaded
            @isLoading = true
            button = @$('.showafter')
            button.html '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
            button.spin 'tiny'
            # make asynchronous to allow the spinner to show up, before heavy
            # call on loadNextPage block the UI for à while.
            setTimeout =>
                @collection.loadNextPage (noMoreEvents) =>
                    if noMoreEvents
                        @lastAlreadyLoaded = true
                        button.hide()

                    button.html t('display next events')
                    button.spin 'none'
                    @isLoading = false
                    callback?()

                , 1
