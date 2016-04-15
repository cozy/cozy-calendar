exports.config =

    # See docs at http://brunch.readthedocs.org/en/latest/config.html.

    paths:
        public:  'public'

    plugins:
        coffeelint:
            options:
                indentation: value: 4, level: 'error'
        jade:
            globals: ['t', 'moment','RRule']

    conventions:
        vendor:  /(vendor)|(tests)(\/|\\)/ # do not wrap tests in modules

    files:
        javascripts:
            joinTo:
                'javascripts/app.js': /^app/
                'javascripts/vendor.js': /^vendor/
            order:
                # Files in `vendor` directories are compiled before other files
                # even if they aren't specified in order.
                before: [
                    'vendor/scripts/jquery-2.1.1.js'
                    'vendor/scripts/jquery-ui-1.10.3.custom.js'
                    'vendor/scripts/bootstrap.js'
                    'vendor/scripts/bootstrap-datepicker.js'
                    'vendor/scripts/bootstrap-timepicker.js'
                    'vendor/scripts/underscore-1.4.4.js'
                    'vendor/scripts/backbone-1.1.2.js'
                    'vendor/scripts/spin.js'
                    'vendor/scripts/rrule.js'
                    'vendor/scripts/moment.js'
                    'vendor/scripts/moment-timezone-with-data.js'
                    'vendor/scripts/fullcalendar.min.js'
                ]

        stylesheets:
            joinTo: 'stylesheets/app.css'
            order:
                before: [
                    'vendor/styles/normalize.css'
                    'vendor/styles/bootstrap.css'
                    'vendor/styles/bootstrap-datepicker.css'
                    'vendor/styles/bootstrap-timepicker.css'
                    'vendor/styles/fullcalendar.min.css'
                ]
                after: ['vendor/styles/helpers.css']

        templates:
            defaultExtension: 'jade'
            joinTo: 'javascripts/app.js'

