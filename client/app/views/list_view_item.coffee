BaseView = require 'lib/base_view'
EventPopover = require './event_popover'
Event = require 'models/event'


module.exports = class EventItemView extends BaseView

    className: 'scheduleElement'
    template: require './templates/list_view_item'

    events:
        'click .edit': 'editMode'
        'click .delete': 'deleteModel'

    initialize: ->
        @listenTo @model, 'change', @render

    deleteModel: ->
        return unless confirm t "are you sure"
        @$el.spin 'tiny'
        @model.event.destroy
            error: ->
                alert 'server error'
                @$el.spin()

    # @TODO : unused, but also outdated (see calendar_view for popover api).
    editMode: ->
        @popover.close() if @popover
        @popover = new EventPopover
            model: @model,
            target: @$el
            parentView: this
            container: $ 'body'
        @popover.render()

    getUrlHash: -> 'list'

    getRenderData: ->
        data = @model.event.toJSON()

        _.extend data,
            type: 'event'
            start: @model.getFormattedStartDate 'HH:mm'
            end: @model.getFormattedEndDate 'HH:mm'
            allDay: @model.isAllDay()
            color: @model.getColor()
            counter: @model.counter

        return data
