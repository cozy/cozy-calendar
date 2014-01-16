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
        view = @cal.fullCalendar('getView')
        return 'week' if view.name is 'agendaWeek'
        return 'month'

    getTitle: ->
        return t('List') unless @cal
        view = @cal.fullCalendar('getView')
        format = if view.name is 'month' then 'MMMM yyyy'
        else "MMM d[ yyyy]{ '&#8212;'[ MMM] d yyyy}"
        return $.fullCalendar.formatDates view.start, view.end, format

    getDates: ->
        view = @cal.fullCalendar('getView')
        return [view.start, view.end]

    isToday: ->
        [start, end] = @getDates()
        (new Date()).isBetween start, end

    getRenderData: ->

        locale = Date.getLocale()

        return data =
            title: @getTitle()
            todaytxt: locale.day.split('|')[1]
            calendarMode: @cal?
            active: (item) =>
                if item is 'today' and @isToday() or item is @getViewName()
                    return 'fc-state-active'

    events: ->
        'click .fc-button-next': => @trigger 'next'
        'click .fc-button-prev': => @trigger 'prev'
        'click .fc-button-today': => @trigger 'today'
        'click .fc-button-month': => app.router.navigate 'calendar', true
        'click .fc-button-week': => app.router.navigate 'calendarweek', true
        'click .fc-button-list': => app.router.navigate 'list', true