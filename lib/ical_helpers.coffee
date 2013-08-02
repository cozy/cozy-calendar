fs = require 'fs'
moment = require 'moment'
lazy = require 'lazy'

# Small module to generate iCal file from JS Objects or to parse iCal file
# to obtain explicit JS Objects.
#
# This module is inpired by the icalendar Python module.


# Buffer manager to easily build long string.
class iCalBuffer
    # Make this buffer streamablE

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


# Base ICal Component. This class is aimed to be extended not to be used
# directly.
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


# Calendar component. It's the representation of the root object of a Calendar.
module.exports.VCalendar = class VCalendar extends VComponent
    name: 'VCALENDAR'

    constructor: (organization, title) ->
        super
        @fields =
            VERSION: "2.0"

        @fields['PRODID'] = "-//#{organization}//NONSGML #{title}//EN"


# An alarm is there to warn the calendar owner of something. It could be
# included in an event or in a todo.
module.exports.VAlarm = class VAlarm extends VComponent
    name: 'VALARM'

    constructor: (date) ->
        super
        @fields =
            ACTION: 'AUDIO'
            REPEAT: '1'
            TRIGGER: @formatIcalDate date


# The VTodo is used to described a dated action.
module.exports.VTodo = class VTodo extends VComponent
    name: 'VTODO'

    constructor: (date, user, description) ->
        super
        @fields =
            DTSTAMP: @formatIcalDate date
            SUMMARY: description
            UID: user

    addAlarm: (date) ->
        @add new VAlarm date

# Additional components not supported yet by Cozy Cloud.
module.exports.VEvent = class VEvent extends VComponent
    name: 'VEVENT'

    constructor: (startDate, endDate, description, location) ->
        super
        @fields =
            DESCRIPTION: description
            DTSTART: @formatIcalDate startDate
            DTEND: @formatIcalDate endDate
            LOCATION: location

formatUTCOffset = (startDate, timezone) ->
    if timezone? and startDate?
        startDate.setTimezone timezone
        diff = startDate.getTimezoneOffset()/6
        if diff is 0
                diff = "+0000"
        else
            if diff < 0
                diff = diff.toString()
                diff = diff.concat '0'
                if diff.length is 4
                    diff = '-0' + diff.substring(1,4)
            else
                diff = diff.toString()
                diff = diff.concat '0'
                if diff.length is 3
                    diff = '+0' + diff.substring(0,3)
                else
                    diff = '+' + diff.substring(0,4)
        diff

module.exports.VTimezone = class VTimezone extends VComponent
    name: 'VTIMEZONE'

    constructor: (startDate, timezone) ->
        super
        @fields = 
            TZID: timezone
        # startShift and endShift are equal because, actually, only alarm has timezone
        diff = formatUTCOffset startDate, timezone
        vstandard = new VStandard startDate, diff, diff
        @add vstandard
        vdaylight = new VDaylight startDate, diff, diff
        @add vdaylight


module.exports.VJournal = class VJournal extends VComponent
    name: 'VJOURNAL'
module.exports.VFreeBusy = class VFreeBusy extends VComponent
    name: 'VFREEBUSY'

module.exports.VStandard = class VStandard extends VComponent
    name: 'STANDARD'

    constructor: (startDate, startShift, endShift) ->
        super
        @fields =
            DTSTART: @formatIcalDate startDate
            TZOFFSETFROM: startShift
            TZOFFSETTO: endShift

module.exports.VDaylight = class VDaylight extends VComponent
    name: 'DAYLIGHT'

    constructor: (startDate, startShift, endShift) ->
        super
        @fields =
            DTSTART: @formatIcalDate startDate
            TZOFFSETFROM: startShift
            TZOFFSETTO: endShift

module.exports.ICalParser = class ICalParser

    @components:
        VTODO: VTodo
        VALARM: VAlarm
        VEVENT: VEvent
        VJOURNAL: VJournal
        VFREEBUSY: VFreeBusy
        VTIMEZONE: VTimezone
        STANDARD: VStandard
        DAYLIGHT: VDaylight

    parseFile: (file, callback) ->
        @parse fs.createReadStream(file), callback

    parse: (stream, callback) ->
        result = {}
        noerror = true
        lineNumber = 0
        component = null
        parent = null

        stream.on 'end', ->
            callback null, result if noerror

        sendError = (msg) ->
            callback new Error "#{msg} (line #{lineNumber})" if noerror
            noerror = false
            # TODO find a way to stop the stream

        createComponent = (name) ->
            parent = component

            if name is "VCALENDAR"
                if result.fields?
                    sendError "Cannot import more than one calendar"
                component = new VCalendar()
                result = component

            else if name in Object.keys(ICalParser.components)
                component = new ICalParser.components[name]()

            else
                sendError "Malformed ical file"

            component?.parent = parent
            parent?.add component

        lineParser = (line) ->
            lineNumber++

            line = line.toString('utf-8').trim()
            tuple = line.split(':')

            if tuple.length < 2
                sendError "Malformed ical file"
            else
                key = tuple[0]
                tuple.shift()
                value = tuple.join('')

                if key is "BEGIN"
                    createComponent value
                else if key is "END"
                    component = component.parent
                else if not (component? or result?)
                    sendError "Malformed ical file"
                else if key? and key isnt '' and component?
                    key = key.split(';')[0]
                    component.fields[key] = value
                else
                    sendError "Malformed ical file"

        lazy(stream).lines.forEach lineParser
