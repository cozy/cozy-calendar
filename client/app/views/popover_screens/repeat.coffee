EventPopoverScreenView = require 'views/calendar_popover_screen_event'

tFormat                 = 'HH:mm'
dFormat                 = 'DD/MM/YYYY'
inputDateDTPickerFormat = 'dd/mm/yyyy'
allDayDateFieldFormat   = 'YYYY-MM-DD'

NO_REPEAT = -1

module.exports = class RepeatPopoverScreen extends EventPopoverScreenView

    inputDateFormat: 'DD/MM/YYYY'
    inputDateDTPickerFormat: 'dd/mm/yyyy'

    screenTitle: t('screen recurrence title')
    templateContent: require 'views/templates/popover_screens/repeat'

    events:
        'change select[name="frequency"]': 'onSelectRepeat'
        'keyup select[name="frequency"]': 'onSelectRepeat'

        'input input[name="interval"]': "renderSummary"
        'change input[name="weekly-repeat-type"]': "renderSummary"
        'change input[name="monthly-repeat-type"]': "renderSummary"
        'change input[name="endMode"]': "renderSummary"
        'input input[name="count"]': "renderSummary"
        'changeDate input[name="until-date"]': "renderSummary"


    getRenderData: ->
        data = _.extend super(),
            NO_REPEAT: NO_REPEAT
            weekDays: moment.localeData()._weekdays

            # Default rrule value.
            rrule:
                freq: NO_REPEAT
                interval: 1
                endMode: 'never'
                count: 4
                until: moment().format(@inputDateFormat)
                weekdays: []
                monthlyRepeatBy: 'repeat-day'

        # Override default rrule value if the event has a rrule.
        if @formModel.has('rrule') and @formModel.get('rrule').length > 0
            # Extract rules from the rrule string.
            try
                rruleOptions = RRule.fromString(@formModel.get('rrule')).options
            catch e
                console.error e

        if rruleOptions?
            # Build the overriden rrule.
            rrule = _.extend data.rrule,
                freq: rruleOptions.freq
                interval: rruleOptions.interval
                weekdays: rruleOptions.byweekday

            # When the recurring mode is monthly, it must check the repeat mode.
            if rruleOptions.freq is RRule.MONTHLY
                if rruleOptions.bymonthday?.length > 0
                    monthlyRepeatBy = 'repeat-day'
                else if rruleOptions.bynweekday?.length > 0
                    monthlyRepeatBy = 'repeat-weekday'
                else
                    monthlyRepeatBy = 'repeat-day'

                rrule.monthlyRepeatBy = monthlyRepeatBy

            # Build the overriden end mode.
            if rruleOptions.until
                endMode =
                    endMode: 'until'
                    until: moment.tz(rruleOptions.until, 'UTC')
                        .format(@inputDateFormat)
            else if rruleOptions.count
                endMode =
                    endMode: 'count'
                    count: rruleOptions.count
            else
                endMode =
                    endMode: 'never'

            # Override data.
            rrule = _.extend rrule, endMode
            data.rrule = rrule

        # Template will use those functions to mark as checked relevant fields.
        functions =
            limitedVisibility: (freq) ->
                if data.rrule.freq isnt freq then "true" else "false"

            genericLimitedVisibility: ->
                if data.rrule.freq is NO_REPEAT then "true" else "false"

            isFreqSelected: (value) ->
                return 'selected' if value is data.rrule.freq

            isWeekdaySelected: (value) ->
                isSelected = data.rrule.byweekday and \
                             (value + 6) % 7 in data.rrule.byweekday
                return 'checked' if isSelected

            monthlyRepeatBy: (value) ->
                return 'checked' if value is data.rrule.monthlyRepeatBy

            isEndModeSelected: (value) ->
                return 'checked' if value is data.rrule.endMode

        # Merge functions into data.
        return _.extend data, functions


    afterRender: ->
        # Initialize date picker for 'until' date field.
        @$('[name="until-date"]').attr('type','text').datetimepicker(
            language: window.app.locale
            fontAwesome: true
            autoclose: true
            format: @inputDateDTPickerFormat
            minView: 2
            viewSelect: 4
            keyboardNavigation: false
            pickerPosition: 'top-right'
        ).on 'changeDate', @renderSummary.bind(@)

        # Update summary.
        @renderSummary()


    # Render the human-readable version of the rrule.
    renderSummary: ->
        rrule = @buildRRuleFromDOM()

        try
            # If this is a valid rrule, it will not throw.
            rrule.toString()

            # Handle localization.
            locale = moment.localeData()
            language =
                dayNames: locale._weekdays
                monthNames: locale._months

            summary = rrule.toText(window.t, language)

            # Perform the actualchange.
            @$('#summary').html summary


    # When the user leaves the screen, save the model.
    onLeaveScreen: ->
        rrule = @buildRRuleFromDOM()

        # Only persist the stringified rrule is there is a recurrence mode
        # selected.
        if rrule.options.freq isnt NO_REPEAT
            rruleString = rrule.toString()

            # Remove DTSTART field because it's unsupported by some client.
            rruleString = rruleString.split ';'
                .filter (s) -> s.indexOf 'DTSTART' isnt 0
                .join ';'
        else
            rruleString = null
        @formModel.set('rrule', rruleString)


    # Build a rrule object from the form fields in the DOM.
    buildRRuleFromDOM: =>
        start = @formModel.getStartDateObject()
        RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE,
            RRule.TH, RRule.FR, RRule.SA]

        options =
            freq: +@$('select[name="frequency"]').val()
            interval: +@$('input[name="interval"]').val()

        # Updates the interval unit to take plurals into account.
        @updateIntervalUnit options.freq, options.interval

        # The selection of specific day is only relevant for weekly events.
        if options.freq is RRule.WEEKLY
            options.byweekday = []
            @$('[name="weekly-repeat-type"]:checked').each (idx, box) ->
                options.byweekday.push RRuleWdays[box.value]
            delete options.byweekday if options.byweekday.length is 7

        # The type of reccurence is only relevant for monthly events.
        else if options.freq is RRule.MONTHLY
            monthmode = @$('[name="monthly-repeat-type"]:checked').val()
            if monthmode is "repeat-day"
                options.bymonthday = start.date()
            else if monthmode is 'repeat-weekday'
                day = RRuleWdays[start.day()]

                # Compute the week number in the month.
                wk = Math.ceil start.date() / 7
                wk = -1 if wk > 4

                options.byweekday = day.nth(wk)

        # Build the "end mode" part.
        switch @$('[name="endMode"]:checked').val()
            when 'count'
                options.count = +@$('[name="count"]').val()
            when 'until'
                rawDate = @$('[name="until-date"]').val()
                options.until = moment.tz rawDate, @inputDateFormat, 'UTC'
                    .toDate()

        return new RRule options


    # Handle the selection of a recurrence mode.
    onSelectRepeat: ->
        value = parseInt @$('select.input-repeat').val()

        # -1 is the default placeholder, it's not bound to any real value.
        if value isnt NO_REPEAT

            # Reset the specific fields' visibility.
            @$('[aria-hidden="false"]:not(.generic)').attr 'aria-hidden', true

            # Turn repeat type into a selector.
            repeatTypeSelector = switch value
                when RRule.WEEKLY then '.weekly-only'
                when RRule.MONTHLY then '.monthly-only'

            # Show fields based on repeat type.
            @$('[aria-hidden="true"].generic').attr 'aria-hidden', false
            @$(repeatTypeSelector).attr 'aria-hidden', false

            @renderSummary()
            @updateIntervalUnit value

        # Hide all the fields if 'no repeat' is selected.
        else
            @$('[aria-hidden="false"]').attr 'aria-hidden', true


    # Update the interval unit string.
    updateIntervalUnit: (unit = null, numberOfUnits = null) ->
        unless unit?
            unit = parseInt @$('select.input-repeat').val()
        unless numberOfUnits?
            numberOfUnits = parseInt @$('input[name="interval"]').val()

        # It doesn't make sense to add the unit when there is no repeation.
        # Prevent a polyglot warning.
        if unit isnt NO_REPEAT
            localizationKey = "screen recurrence interval unit #{unit}"
            unitString = t(localizationKey, smart_count: numberOfUnits)
            @$('#intervalUnit').html unitString
