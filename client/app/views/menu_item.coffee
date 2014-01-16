BaseView = require '../lib/base_view'
Popover = require './calendar_popover'
Event = require '../models/event'
colorhash = require 'lib/colorhash'


module.exports = class MenuItemView extends BaseView

    tagName: 'a'
    className: 'tagmenuitem'
    template: require './templates/menu_item'

    events:
        'click': 'toggleVisible'

    toggleVisible: ->
        unless app.router.onCalendar
            app.router.navigate 'calendar', true
        @model.set 'visible', not @model.get 'visible'
        @render()

    getRenderData: ->
        label: @model.get 'label'
        color: colorhash @model.get 'label'
        visible: @model.get 'visible'