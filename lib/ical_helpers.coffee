fs = require 'fs'
moment = require 'moment'
lazy = require 'lazy'

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

module.exports.VCalendar = VCalendar = class VCalendar extends VComponent
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


module.exports.VTodo = VTodo = class VTodo extends VComponent
    name: 'VTODO'

    constructor: (date, user, description) ->
        super
        @fields =
            DSTAMP: @formatIcalDate date
            SUMMARY: description
            UID: user

    addAlarm: (date) ->
        @add new VAlarm date

module.exports.VEvent = VEvent = class VEvent extends VComponent
    name = 'VEVENT'
module.exports.VJournal = VJournal = class VJournal extends VComponent
    name = 'VJOURNAL'
module.exports.VFreeBusy = VFreeBusy = class VFreeBusy extends VComponent
    name = 'VFREEBUSY'
module.exports.VTimezone = VTimezone = class VTimezone extends VComponent
    name = 'VTIMEZONE'
module.exports.VStandard = VStandard = class VStandard extends VComponent
    name = 'VSTANDARD'
module.exports.VDaylight = VDaylight = class VDaylight extends VComponent
    name = 'VDAYLIGHT'

components =
    VCALENDAR: VCalendar
    VTODO: VTodo
    VALARM: VAlarm
    VEVENT: VEvent
    VJOURNAL: VJournal
    VFREEBUSY: VFreeBusy
    VTIMEZONE: VTimezone
    VSTANDARD: VStandard

module.exports.ICalParser = class ICalParser

    parseFile: (file, callback) ->
        @parse fs.createReadStream(file), callback

    parse: (stream, callback) ->
        result = {}
        noerror = true

        stream.on 'end', ->
            callback null, result if noerror

        sendError = (msg) ->
            noerror = false
            stream.close()
            callback new Error "Malformed ical file (line #{lineNumber})"

        lineNumber = 0
        component = null
        parent = null

        lazy(stream).lines.forEach (line) ->
            lineNumber++
            line = line.toString('utf-8').trim()
            tuple = line.split(':')

            if tuple.length < 2
                sendError "Malformed ical file (line #{lineNumber})"
            else
                key = tuple[0]
                tuple.shift()
                value = tuple.join('')

                if key is "BEGIN"
                    parent = component

                    if value is "VCALENDAR"
                        if result.fields?
                            sendError "Cannot import more than one " + \
                                "calendar (line #{lineNumber})"
                        component = new VCalendar()
                        result = component

                    else if value in Object.keys(components)
                        component = new components[value]()

                    else
                        sendError "Malformed ical file (line #{lineNumber})"

                    component?.parent = parent
                    parent?.add component

                else if key is "END"
                    component = component.parent

                else if not (component? or result?)
                    noerror = false
                    @close()
                    callback new Error "Malformed ical file (line #{lineNumber})"

                else
                    component.fields[key] = value
