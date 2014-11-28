BaseView = require '../lib/base_view'

module.exports = class RRuleView extends BaseView

    template: require './templates/event_modal_rrule'
    inputDateFormat: 'DD/MM/YYYY'
    inputDateDTPickerFormat: 'dd/mm/yyyy'

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
            autoclose: true
            format: @inputDateDTPickerFormat
            minView: 2
            viewSelect: 4
            keyboardNavigation: false
            # datepicker only
        ).on 'changeDate', @updateHelp

    getRenderData: ->
        data =
            weekDays: moment.localeData()._weekdays

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
            rrule.until = moment.tz options.until, 'UTC'
                            .format @inputDateFormat
            rrule.count = ''

        else if options.count
            rrule.endMode = 'count'
            rrule.count = options.count
            rrule.until = ''

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

    hasRRule: =>
        @$('#rrule-freq').val() isnt 'NOREPEAT'

    getRRule: =>
        start = @model.getStartDateObject()
        RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE,
            RRule.TH, RRule.FR, RRule.SA]

        options =
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
                options.bymonthday = start.date()
            else if monthmode is 'weekdate'
                day = RRuleWdays[start.day()]

                # Compute the week number in the month.
                wk = Math.ceil start.date() / 7
                wk = -1 if wk > 4

                options.byweekday = day.nth(wk)

        # count or until
        switch @$('input:radio[name=endMode]:checked').val()
            when 'count'
                options.count = +@$('#rrule-count').val()
            when 'until'
                rawDate = @$('#rrule-until').val()
                options.until = moment.tz rawDate, @inputDateFormat, 'UTC'
                    .toDate()

        new RRule options

    showRRule: =>
        @updateHelp()
        @$('#rrule-action').hide()
        @$('#rrule-short').slideDown =>
            @$('#rrule').slideDown()


    # if [count] in entered, empty [until] value & viceversa
    toggleCountUntil: (event) =>
        radio = @$('input:radio[name=endMode]')

        if event.target.id is 'rrule-count'
            @$('#rrule-until').val ''
            radio[1].checked = true

        else if event.target.id is 'rrule-until'
            @$('#rrule-count').val ''
            radio[2].checked = true

        @updateHelp()

    updateHelp: =>
        freq = @$('#rrule-freq').val()
        if freq is 'NOREPEAT'
            @$('#rrule-action').show()
            @$('#rrule-help').html t 'no recurrence'
            @$('#rrule-interval').toggle false
            @$('#rrule-monthdays').toggle false
            @$('#rrule-weekdays').toggle false
            @$('#rrule-repeat').toggle false
            return
        else freq = +freq

        @$('#rrule-interval').toggle true
        @$('#rrule-repeat').toggle true

        @$('#rrule-monthdays').toggle freq is RRule.MONTHLY
        @$('#rrule-weekdays').toggle  freq is RRule.WEEKLY
        locale = moment.localeData()
        language =
            dayNames: locale._weekdays
            monthNames: locale._months
        @$('#rrule-help').html @getRRule().toText(window.t, language)
        return true
