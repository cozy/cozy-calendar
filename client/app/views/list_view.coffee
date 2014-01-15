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
        'click .showbefore': 'showbefore'

    afterRender: ->
        @calHeader = new Header()
        super
        @$('#alarm-list').prepend @calHeader.render().$el

    appendView: (view) ->
        index = @collection.indexOf view.model
        el = view.$el
        today = (new Date()).beginningOfDay()
        if view.model.get('date').isBefore today
            el.addClass('before').hide()
        else
            el.addClass('after')

        if index is 0 then @$collectionEl.prepend el
        else
            prevCid = @collection.at(index-1).cid
            @views[prevCid].$el.after el


    showbefore: =>
        first = @$('.after').first()
        body = $('html, body')
        @$('.before').slideDown
            progress: -> body.scrollTop first.offset().top

        @$('.showbefore').fadeOut()
