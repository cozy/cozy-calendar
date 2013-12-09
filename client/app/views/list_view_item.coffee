BaseView = require '../lib/base_view'
Popover = require './calendar_popover'
Event = require '../models/event'


module.exports = class AlarmView extends BaseView

    className: 'scheduleElement'
    template: require './templates/list_view_item'

    events:
        'click .icon-pencil':'editMode'
        'click .icon-trash':'deleteModel'

    initialize: ->
        @listenTo @model, "change", @render

    deleteModel: ->
        return unless confirm t "are you sure"
        @$el.spin 'tiny'
        @model.destroy
            error: ->
                alert('server error')
                @$el.spin()

    editMode: -> #@TODO
        @popover.close() if @popover
        @popover = new Popover
            model: @model,
            target: @$el
            parentView: this
            container: $('body')
        @popover.render()

    getUrlHash: -> 'list'

    getRenderData: ->
        data = @model.toJSON()
        if @model instanceof Event
            _.extend data,
                type: 'event'
                start: @model.getFormattedStartDate '{HH}:{mm}'
                end: @model.getFormattedEndDate '{HH}:{mm}'
        else
            _.extend data,
                type: 'alarm'
                time: @model.getFormattedDate '{HH}:{mm}'

        return data

