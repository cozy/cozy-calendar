app = require 'application'

$ ->
    require 'lib/app_helpers'

    moment.locale(window.locale)
    # If needed, add locales to client/vendor/scripts/lang
    # from : https://github.com/moment/moment/tree/develop/locale
    locale = moment.localeData()
    # @TODO : why "en" default
    $.fn.datetimepicker.dates['en'] = { # as default
        days: locale._weekdays
        daysShort: locale._weekdaysShort
        daysMin: locale._weekdaysMin
        months: locale._months
        monthsShort: locale._monthsShort
        today: locale.calendar["sameDay"]
        suffix: [], # ?
        meridiem: locale.meridiem()
        weekStart: locale._week["dow"]
        # datetimepicker and moment use different convention for short naming
        # of datetime components
        format: locale._longDateFormat.L
                    .replace /D/g, 'd'
                    .replace /M/g, 'm'
                    .replace /Y/g, 'y'
                    .replace /H/g, 'h'
                    .replace /h/g, 'H'
                    .replace /m/g, 'i'
    }

    app.initialize()

    # Initialize Spin JS the lib that displays loading indicators
    $.fn.spin = (opts, color) ->
        presets =
            tiny:
                lines: 8
                length: 2
                width: 2
                radius: 3

            small:
                lines: 8
                length: 1
                width: 2
                radius: 5

            large:
                lines: 10
                length: 8
                width: 4
                radius: 8

        if Spinner
            @each ->
                $this = $ this
                spinner = $this.data 'spinner'
                if spinner?
                    spinner.stop()
                    $this.data 'spinner', null
                else if opts isnt false
                    if typeof opts is 'string'
                        if opts of presets
                            opts = presets[opts]
                        else
                            opts = {}
                        opts.color = color if color
                    spinner = new Spinner(
                        $.extend(color: $this.css("color"), opts))
                    spinner.spin this
                    $this.data "spinner", spinner

        else
            console.log "Spinner class not available."
            null
