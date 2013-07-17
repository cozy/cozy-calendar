moment = require 'moment'

class iCalBuffer

    txt: ''

    addString: (text) ->
        @txt += text

    addStrings: (texts) ->
        @addString text for text in texts

    addLine: (text) ->
        @addString "#{text}\r\n"

    addLines: (texts) ->
        @addLine text for text in texts

    toString: -> @txt


module.exports.VComponent = class VComponent
    name: 'VCOMPONENT'

    constructor: ->
        @subComponents = []
        @fields = {}

    toString: ->
        buf = new iCalBuffer
        buf.addLine "BEGIN:#{@name}"
        buf.addLine "#{att}:#{val}" for att, val of @fields
        buf.addLine component.toString() for component in @subComponents
        buf.addString "END:#{@name}"

    formatIcalDate: (date) ->
        moment(date).format('YYYYMMDDTHHmm00')

    add: (component) ->
        @subComponents.push component

module.exports.VCalendar = class VCalendar extends VComponent
    name: 'VCALENDAR'

    constructor: (organization, title) ->
        super
        @fields =
            VERSION: "2.0"

        @fields['PRODID'] = "-//#{organization}//NONSGML #{title}//EN"


module.exports.VAlarm = VAlarm = class VAlarm extends VComponent
    name: 'VALARM'

    constructor: (date) ->
        super
        @fields =
            ACTION: 'AUDIO'
            REPEAT: '1'
            TRIGGER: @formatIcalDate date


module.exports.VTodo = class VTodo extends VComponent
    name: 'VTODO'

    constructor: (date, user, description) ->
        super
        @fields =
            DSTAMP: @formatIcalDate date
            SUMMARY: description
            UID: user

    addAlarm: (date) ->
        @add new VAlarm date
