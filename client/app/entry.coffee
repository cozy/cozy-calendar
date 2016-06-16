# Get CSS
require 'normalize.css/normalize.css'
require 'fullcalendar/dist/fullcalendar.css'
require 'bootstrap-2.3.2/css/bootstrap.css'
require 'bootstrap-timepicker/css/bootstrap-timepicker.css'
require 'bootstrap-datetime-picker/css/bootstrap-datetimepicker.css'
# @TODO : we should only use dependencies from NPM, but
# the custom jquery-ui build we use is different from NPM's
require '../vendor/styles/jquery-ui-1.10.3.custom.css'
# require 'jquery-ui/themes/base/jquery.ui.core.css'
# require 'jquery-ui/themes/base/jquery.ui.core.css'
# require 'jquery-ui/themes/base/jquery.ui.resizable.css'
# require 'jquery-ui/themes/base/jquery.ui.autocomplete.css'
# require 'jquery-ui/themes/base/jquery.ui.menu.css'
# require 'jquery-ui/themes/base/jquery.ui.theme.css'
require '../vendor/styles/helpers.css'
require 'styles/application'


# Expose globals javascript
window._ = require('underscore')
window.$ = window.jQuery = require('jquery')
# require('jquery-ui')
require('fullcalendar')
window.Spinner = require('spin.js')
require('jquery-ui/autocomplete')
window.Backbone = require('backbone')
window.Backbone.$ = window.$
require('backbone-mediator')
window.async = require('async')
window.moment = require('moment')
require('moment-timezone')
window.Polyglot = require('node-polyglot')
window.Polyglot.loadLanguageFiles = ->
window.RRule = require('rrule')
# require('rrule/lib/nlp')
require('bootstrap-2.3.2/js/bootstrap-typeahead')
require('bootstrap-2.3.2/js/bootstrap-modal')
require('bootstrap-timepicker')
require('bootstrap-datetime-picker')
window.io = require('socket.io-client')
window.ColorHash = require('../vendor/scripts/ColorHash')
window.CozySocketListener = require('cozy-realtime-adapter/lib/client')
                            .CozySocketListener

# start app
require('./initialize')
