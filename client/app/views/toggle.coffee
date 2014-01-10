BaseView = require '../lib/base_view'


module.exports = class Toggle extends BaseView

    value: false
    tagName: 'span'
    className: 'badge'
    template: (data) ->
        "<i class='icon-#{data.icon}'></i>"

    initialize: (options) ->
        @value = options.value
        @icon = options.icon
        @label = options.label
        @render()
        @toggle @value

    getRenderData: () -> icon: @icon

    events: ->
        'click': => @toggle()

    toggle: (value) ->
        value ?= not @value
        @value = value
        if @value
            @$el.addClass 'badge-info'
            @$('i').addClass 'icon-white'
        else
            @$el.removeClass 'badge-info'
            @$('i').removeClass 'icon-white'

        title = @label + ' : ' + t(if value then 'ON' else 'OFF')
        @$el.attr 'title', title
        @trigger 'toggle', value