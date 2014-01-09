BaseView = require '../lib/base_view'

module.exports = class RRuleView extends BaseView

    template: require('./templates/event_modal_rrule')
    inputDateFormat: '{year}-{MM}-{dd}'

    events: ->
        'click  .rrule-show': 'showRRule'
        'change #rrule': 'updateHelp'
        'changeDate #rrule-until': 'toggleCountUntil'
        'input  #rrule-until': 'toggleCountUntil'
        'change #rrule-count': 'toggleCountUntil'

    afterRender: ->
        @$('#rrule').hide()
        @updateHelp()

        @$('#rrule-until').attr('type','text').datetimepicker(
            format: 'dd/mm/yyyy'
            minView: 2 # datepicker only
        ).on 'changeDate', @updateHelp

    isVisible: -> @$('#rrule-help').is ':visible'

    getRenderData: ->
        data =
            weekDays: Date.getLocale().weekdays.slice(0, 7)
            units: Date.getLocale().units

        unless @model.has 'rrule'
            return _.extend data,
                rrule: freq: 'NOREPEAT', interval: 1, count: 4, until: ""
                freqSelected: (value) -> 'selected' if value is 'NOREPEAT'
                wkdaySelected: -> false
                endModeSelected: (value) -> 'selected' if value is 'forever'
                yearModeIs: (value) -> "checked" if value is 'date'


        options = RRule.fromString(@model.get('rrule')).options
        rrule =
            freq: options.freq
            interval: options.interval

        if options.until
            rrule.endMode = 'until'
            rrule.until = Date.create(options.until).format @inputDateFormat
            rrule.count = ""
        else if options.count
            rrule.endMode = 'count'
            rrule.count = options.count
            rrule.until = ""
        else
            rrule.endMode = 'forever'
            rrule.count = ''
            rrule.until = ''

        return _.extend data,
            rrule: rrule
            freqSelected: (value) ->
                result = value is rrule.freq
                if result then 'selected'
            wkdaySelected: (value) ->
                result = options.byweekday and (value+6)%7 in options.byweekday
                if result then 'checked'
            endModeSelected: (value) ->
                if value is rrule.endMode then 'selected'
            yearModeIs: (value) ->
                result = (value is 'weekdate' and options.bynweekday?.length) or
                (value is 'date' and options.bymonthday?.length)
                if result then 'checked'


    getRRule: =>
        start = @model.getStartDateObject()
        RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE,
            RRule.TH, RRule.FR, RRule.SA]

        options =
            dtstart: start
            freq: +@$('#rrule-freq').val()
            interval: +@$('#rrule-interval').val()

        if options.freq is RRule.WEEKLY
            options.byweekday = []
            @$('#rrule-weekdays :checked').each (idx, box) ->
                options.byweekday.push RRuleWdays[box.value]
            delete options.byweekday if options.byweekday.length is 7

        else if options.freq is RRule.MONTHLY
            monthmode = @$('#rrule-monthdays :radio:checked').val()
            if monthmode is "date"
                options.bymonthday = start.getDate()
            else if monthmode is 'weekdate'
                day = RRuleWdays[start.getDay()]
                endOfMonth = start.clone().endOfMonth()
                if start.getDate() > endOfMonth.getDate() - 7
                    wk = -1
                else
                    wk = Math.ceil start.getDate() / 7

                options.byweekday = day.nth(wk)

        # count or until
        switch @$('input:radio[name=endMode]:checked').val()
            when 'count'
                options.count = +@$('#rrule-count').val()
            when 'until'
                options.until = Date.create @$('#rrule-until').val(), 'fr'

        new RRule options

    showRRule: =>
        @updateHelp()
        @$('#rrule-short #rrule-action').hide()
        @$('#rrule-short').slideDown =>
            @$('#rrule').slideDown()


    # if [count] in entered, empty [until] value & viceversa
    toggleCountUntil: (event) =>

        radio = @$('input:radio[name=endMode]')

        if event.target.id is "rrule-count"
            @$('#rrule-until').val('')
            radio[1].checked = true

        else if event.target.id is "rrule-until"
            @$('#rrule-count').val('')
            radio[2].checked = true

        @updateHelp()

    updateHelp: =>
        freq = @$('#rrule-freq').val()
        if freq is 'NOREPEAT'
            @$('#rrule-toggle').show()
            @$('#rrule-short').hide()
            @$('#rrule').hide()
            @$('#rrule-freq').val 'WEEKLY'
            @$('rrule-help').html t 'no reccurence'
            return
        else freq = +freq

        @$('#rrule-monthdays').toggle freq is RRule.MONTHLY
        @$('#rrule-weekdays').toggle  freq is RRule.WEEKLY
        locale = Date.getLocale()
        language =
            dayNames: locale.weekdays.slice(0, 7)
            monthNames: locale.full_month.split('|').slice(1,13)
        @$('#rrule-help').html @getRRule().toText(window.t, language)
        return true