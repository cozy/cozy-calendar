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
    subComponents: []
    fields: {}

    toString: ->
        buf = new iCalBuffer
        buf.addLine "BEGIN:#{@name}"
        buf.addLine "#{att}:#{val}" for att, val of @fields
        buf.addString component.toString() for component in @subComponents
        buf.addString "END:#{@name}"

    formatIcalDate: (date) ->
        moment(date).format('YYYYMMDDTHHmm00')


module.exports.VCalendar = class VCalendar extends VComponent
    name: 'VCALENDAR'
    fields:
        'VERSION': '2.0'
        'PRODID': null

    constructor: (organization, title) ->
        @fields['PRODID'] = "-//#{organization}//NONSGML #{title}//EN"


module.exports.VAlarm = class VAlarm extends VComponent
    name: 'VALARM'
    fields:
        'ACTION': 'AUDIO'
        'REPEAT': '1'

    constructor: (date) ->
        @fields['TRIGGER'] = @formatIcalDate date


module.exports.VTodo = class VAlarm extends VComponent
    name: 'VTODO'

    constructor: (date, user, description) ->
        @fields['DSTAMP'] = @formatIcalDate date
        @fields['SUMMARY'] = description
        @fields['UID'] = user
