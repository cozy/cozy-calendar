exports.config =

    # See docs at http://brunch.readthedocs.org/en/latest/config.html.

    paths:
        public:  'public'
        test: 'tests'

    plugins:
        coffeelint:
            options:
                indentation: value: 4, level: 'error'

    conventions:
        vendor:  /(vendor)|(tests)(\/|\\)/ # do not wrap tests in modules

    files:
        javascripts:
            joinTo:
                'javascripts/app.js': /^app/
                'javascripts/vendor.js': /^vendor/
                '../tests/tests.js': /^test.*\.coffee/
            order:
                # Files in `vendor` directories are compiled before other files
                # even if they aren't specified in order.
                before: [
                    'vendor/scripts/jquery-1.8.2.js'
                    'vendor/scripts/bootstrap.js'
                    'vendor/scripts/bootstrap-datepicker.js'
                    'vendor/scripts/bootstrap-timepicker.js'
                    'vendor/scripts/underscore-1.4.4.js'
                    'vendor/scripts/backbone-1.0.0.js'
                    'vendor/scripts/xdate-0.8.js'
                ]

        stylesheets:
            joinTo: 'stylesheets/app.css'
            order:
                before: [
                    'vendor/styles/normalize.css',
                    'vendor/styles/bootstrap.css',
                    'vendor/styles/bootstrap-datepicker.css'
                    'vendor/styles/bootstrap-timepicker.css'
                ]
                after: ['vendor/styles/helpers.css']

        templates:
            defaultExtension: 'jade'
            joinTo: 'javascripts/app.js'
