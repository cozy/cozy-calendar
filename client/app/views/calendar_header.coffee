BaseView = require '../lib/base_view'


module.exports = class CalendarHeader extends BaseView

    tagName: 'table'
    id: 'calendarHeader'
    className: 'fc-header'
    template: require './templates/calendar_header'

    initialize: (options) ->
        @cal = options?.cal

    getViewName: ->
        return 'list' unless @cal?
        view = @cal.fullCalendar 'getView'
        return 'week' if view.name is 'agendaWeek'
        return 'month'

    getTitle: ->
        return t('List') unless @cal

        view = @cal.fullCalendar 'getView'

        if view.name is 'month'
            res = view.intervalStart.format 'MMMM YYYY'

        else
            from = view.start
            to = view.end.subtract 1, 'days'
            range = $.fullCalendar.formatRange from, to, 'MMM D YYYY'
            res = "#{t 'week'} #{view.start.format 'w'} | #{range}"


        return res

    getDates: ->
        view = @cal.fullCalendar 'getView'
        return [view.start, view.end]

    isToday: ->
        [start, end] = @getDates()
        return start < moment() < end

    getRenderData: ->
        return data =
            title: @getTitle()
            todaytxt: t('today')
            calendarMode: @cal?
            active: (item) =>
                if item is 'today' and @isToday() or item is @getViewName()
                    return 'fc-state-active'

    events: ->
        'click .fc-button-next': => @trigger 'next'
        'click .fc-button-prev': => @trigger 'prev'
        'click .fc-button-today': => @trigger 'today'
        'click .fc-button-month': => @trigger 'month'
        'click .fc-button-week': => @trigger 'week'
        'click .fc-button-list': => @trigger 'list'
