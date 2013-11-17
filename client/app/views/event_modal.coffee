BaseView       = require 'lib/base_view'
app            = require 'application'

module.exports = class EventModal extends BaseView

    template: require './templates/event_modal'

    id: 'event-modal'
    className: 'modal fade'

    inputDateTimeFormat: '{year}-{MM}-{dd}T{hh}:{mm}:{ss}'
    inputDateFormat: '{year}-{MM}-{dd}'

    events: ->
        'click  #confirm-btn': 'save'
        'click  #cancel-btn': 'close'
        'click  .rrule-show': 'showRRule'
        'change #rrule': 'updateHelp'
        'input  #rrule-until': 'toggleCountUntil'
        'change #rrule-count': 'toggleCountUntil'

    afterRender: ->
        @$('#rrule').hide()
        if @model.get('rrule')
            @setRRule
            @updateHelp()
            @$('#rrule-toggle').hide()
        else
            @$('#rrule').hide()
            @$('#rrule-short').hide()

        @$el.modal 'show'

    getRenderData: ->
        data = _.extend {}, @model.toJSON(),
            weekDays: Date.getLocale().weekdays.slice(0, 7)
            units: Date.getLocale().units
            start: @model.getStartDateObject().format @inputDateTimeFormat
            end: @model.getEndDateObject().format @inputDateTimeFormat

        if @model.get 'rrule'
            _.extend data, @getRRuleRenderData()
        else # default RRule
            _.extend data,
                rrule: freq: RRule.WEEKLY, interval: 1, count: 4, until: ""
                freqSelected: (value) -> 'selected' if value is RRule.WEEKLY
                wkdaySelected: -> false
                yearModeIs: (value) -> "checked" if value is 'date'

        return data

    getRRuleRenderData: ->

        options = RRule.fromString(@model.get('rrule')).options
        rrule =
            freq: options.freq
            interval: options.interval

        if options.until
            rrule.until = Date.create(options.until).format @inputDateFormat
            rrule.count = ""
        else if options.count
            rrule.count = options.count
            rrule.until = ""

        return data =
            rrule: rrule
            freqSelected: (value) ->
                result = value is rrule.freq
                if result then 'selected'
            wkdaySelected: (value) ->
                result = options.byweekday and (value+6)%7 in options.byweekday
                if result then 'checked'
            yearModeIs: (value) ->
                result = (value is 'weekdate' and options.bynweekday?.length) or
                (value is 'date' and options.bymonthday?.length)
                if result then 'checked'


    save: =>
        return if @$('confirm-btn').hasClass 'disabled'
        @model.set
            description: @$('#basic-summary').val()
            place: @$('#basic-place').val()
            start: Date.create(@$('#basic-start').val()).format Event.dateFormat
            end: Date.create(@$('#basic-end').val()).format Event.dateFormat

        if @$('#rrule-help').is ':visible'
            @model.set rrule: @getRRule().toString()
        else
            @model.set 'rrule', ''


        @model.save {},
            success: =>
                @close()
            error: =>
                alert('server error');
                @close()

    showRRule: =>
        @$('#rrule').show()
        @$('#rrule-short').show()
        @$('#rrule-short a').hide()
        @$('#rrule-toggle').hide()
        @updateHelp()

    # Recurence
    getRRule: =>
        start = @model.getStartDateObject()
        console.log start
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
        if @$('#rrule-count').val() isnt ''
            options.count = +@$('#rrule-count').val()
        else
            options.until = Date.create @$('#rrule-until').val()

        new RRule options




    # if [count] in entered, empty [until] value & viceversa
    toggleCountUntil: (event) =>
        if event.target.id is "rrule-count"
            @$('#rrule-until').val('')

        else if event.target.id is "rrule-until"
            @$('#rrule-count').val('')

    updateHelp: =>
        freq = @$('#rrule-freq').val()
        if freq is 'NOREPEAT'
            @$('#rrule-toggle').show()
            @$('#rrule-short').hide()
            @$('#rrule').hide()
            @$('#rrule-freq').val 'WEEKLY'
            return
        else freq = +freq

        @$('#rrule-monthdays').toggle freq is RRule.MONTHLY
        @$('#rrule-weekdays').toggle  freq is RRule.WEEKLY
        locale = Date.getLocale()
        language =
            dayNames: locale.weekdays.slice(0, 7)
            monthNames: locale.full_month.split('|').slice(1,13)
        @$('#rrule-help').html @getRRule().toText(window.t, language)

    close: =>
        @$el.modal 'hide'
        @$el.on 'hidden', =>
            @remove()
            app.router.navigate ''

