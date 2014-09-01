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

        formatDates = $.fullCalendar.formatDates

        view = @cal.fullCalendar 'getView'

        if view.name is 'month'
            formatMonth = 'MMMM'
            formatYear = ' yyyy'
            res = t formatDates view.start, '', formatMonth
            res += formatDates view.start, '', formatYear

        else
            format = "MMM d[ yyyy]{ ' - '[ MMM] d yyyy}"
            res = $.fullCalendar.formatDates view.start, view.end, format
            res = res.replace 'Jan', t 'Jan'
            res = res.replace 'Feb', t 'Feb'
            res = res.replace 'Mar', t 'Mar'
            res = res.replace 'Apr', t 'Apr'
            res = res.replace 'Jun', t 'Jun'
            res = res.replace 'Jul', t 'Jul'
            res = res.replace 'Aug', t 'Aug'
            res = res.replace 'Sep', t 'Sep'
            res = res.replace 'Oct', t 'Oct'
            res = res.replace 'Nov', t 'Nov'
            res = res.replace 'Dec', t 'Dec'
        res

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
        'click .fc-button-month': => @trigger 'month'
        'click .fc-button-week': => @trigger 'week'
        'click .fc-button-list': => @trigger 'list'
