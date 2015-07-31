app = require 'application'
colorSet = require './helpers/color-set'

# Send client side errors to server
window.onerror = (msg, url, line, col, error) ->
    console.error msg, url, line, col, error, error?.stack
    exception = error?.toString() or msg
    if exception isnt window.lastError
        data =
            data:
                type: 'error'
                error:
                    msg: msg
                    name: error?.name
                    full: exception
                    stack: error?.stack
                url: url
                line: line
                col: col
                href: window.location.href
        xhr = new XMLHttpRequest()
        xhr.open 'POST', 'log', true
        xhr.setRequestHeader "Content-Type", "application/json;charset=UTF-8"
        xhr.send JSON.stringify(data)
        window.lastError = exception


$ ->
    try
        # If needed, add locales to client/vendor/scripts/lang
        moment.locale window.locale

        ColorHash.addScheme 'cozy', colorSet

        # Initialize Spin JS the lib that displays loading indicators
        # /!\ this must be done before app init to prevent $().spin() to be undefined
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

        app.initialize()

    catch e
        console.error e, e?.stack
        exception = e.toString()
        if exception isnt window.lastError
            # Send client side errors to server
            data =
                data:
                    type: 'error'
                    error:
                        msg: e.message
                        name: e?.name
                        full: exception
                        stack: e?.stack
                    file: e?.fileName
                    line: e?.lineNumber
                    col: e?.columnNumber
                    href: window.location.href
            xhr = new XMLHttpRequest()
            xhr.open 'POST', 'log', true
            xhr.setRequestHeader "Content-Type",
                "application/json;charset=UTF-8"
            xhr.send JSON.stringify(data)
            window.lastError = exception
