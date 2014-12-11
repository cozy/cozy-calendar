BaseView = require 'lib/base_view'
PopoverEvent = require './calendar_popover_event'
Event = require 'models/event'
colorHash = require 'lib/colorhash'


module.exports = class EventItemView extends BaseView

    className: 'scheduleElement'
    template: require './templates/list_view_item'

    events:
        'click .icon-pencil': 'editMode'
        'click .icon-trash': 'deleteModel'

    initialize: ->
        @listenTo @model, 'change', @render
        @listenTo app.tags, 'change:visible', @render

    deleteModel: ->
        return unless confirm t "are you sure"
        @$el.spin 'tiny'
        @model.destroy
            error: ->
                alert 'server error'
                @$el.spin()

    # @TODO : unused, but also outdated (see calendar_view for popover api).
    editMode: ->
        @popover.close() if @popover
        @popover = new PopoverEvent
            model: @model,
            target: @$el
            parentView: this
            container: $ 'body'
        @popover.render()

    getUrlHash: -> 'list'

    getRenderData: ->
        data = @model.event.toJSON()
        # data = @model.toJSON()
        _.extend data,
            type: 'event'
            start: @model.getFormattedStartDate 'HH:mm'
            end: @model.getFormattedEndDate 'HH:mm'
            allDay: @model.isAllDay()
            color: @model.getColor()

        return data
