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
        #@$el.prepend @calHeader.render().$el
        @$('#calheader').html @calHeader.render().$el
        @calHeader.on 'month', -> app.router.navigate '', trigger:true
        @calHeader.on 'week', -> app.router.navigate 'week', trigger:true
        
        @$('#list-container').scroll @checkScroll
        super

    appendView: (view) ->
        index = @collection.indexOf view.model
        el = view.$el

        # today = moment().startOf('day')
        # if view.model.get('date').isBefore today
        #     el.addClass('before').hide()
        # else
        #     el.addClass('after')

        if index is 0 then @$(@collectionEl).prepend el
        else
            prevCid = @collection.at(index-1).cid
            @views[prevCid].$el.after el

    checkScroll: =>
        triggerPoint = 100 # 100px from the bottom
        if @el.scrollTop + @el.clientHeight + triggerPoint > @el.scrollHeight
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