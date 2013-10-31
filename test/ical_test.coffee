should = require('should')
async = require('async')
time = require 'time'
Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
clientDS = new Client 'http://localhost:9101'
helpers = require './helpers'

{ICalParser, VCalendar, VAlarm, VTodo, VEvent} = require '../lib/ical_helpers'

expectedContent = """
    BEGIN:VCALENDAR
    VERSION:2.0
    PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN
    BEGIN:VTIMEZONE
    TZID:Europe/Paris
    TZURL:http://tzurl.org/zoneinfo/Europe/Paris.ics
    BEGIN:STANDARD
    DTSTART:20130423T144000
    TZOFFSETFROM:-0200
    TZOFFSETTO:-0200
    END:STANDARD
    BEGIN:DAYLIGHT
    DTSTART:20130423T144000
    TZOFFSETFROM:-0200
    TZOFFSETTO:-0200
    END:DAYLIGHT
    END:VTIMEZONE
    BEGIN:VTODO
    DTSTAMP:20130423T144000Z
    SUMMARY:Something to remind
    UID:[id-1]
    BEGIN:VALARM
    ACTION:DISPLAY
    REPEAT:1
    TRIGGER:20130423T144000Z
    END:VALARM
    END:VTODO
    BEGIN:VTIMEZONE
    TZID:Africa/Abidjan
    TZURL:http://tzurl.org/zoneinfo/Africa/Abidjan.ics
    BEGIN:STANDARD
    DTSTART:20130424T133000
    TZOFFSETFROM:+0000
    TZOFFSETTO:+0000
    END:STANDARD
    BEGIN:DAYLIGHT
    DTSTART:20130424T133000
    TZOFFSETFROM:+0000
    TZOFFSETTO:+0000
    END:DAYLIGHT
    END:VTIMEZONE
    BEGIN:VTODO
    DTSTAMP:20130424T133000Z
    SUMMARY:Something else to remind
    UID:[id-2]
    BEGIN:VALARM
    ACTION:DISPLAY
    REPEAT:1
    TRIGGER:20130424T133000Z
    END:VALARM
    END:VTODO
    BEGIN:VTIMEZONE
    TZID:Pacific/Apia
    TZURL:http://tzurl.org/zoneinfo/Pacific/Apia.ics
    BEGIN:STANDARD
    DTSTART:20130425T113000
    TZOFFSETFROM:-1300
    TZOFFSETTO:-1300
    END:STANDARD
    BEGIN:DAYLIGHT
    DTSTART:20130425T113000
    TZOFFSETFROM:-1300
    TZOFFSETTO:-1300
    END:DAYLIGHT
    END:VTIMEZONE
    BEGIN:VTODO
    DTSTAMP:20130425T113000Z
    SUMMARY:Another thing to remind
    UID:[id-3]
    BEGIN:VALARM
    ACTION:DISPLAY
    REPEAT:1
    TRIGGER:20130425T113000Z
    END:VALARM
    END:VTODO
    BEGIN:VEVENT
    DESCRIPTION:my description
    DTSTART:20130609T150000Z
    DTEND:20130610T150000Z
    LOCATION:my place
    UID:[id-4]
    END:VEVENT
    END:VCALENDAR
    """.replace(/\n/g, '\r\n')

describe "Calendar export/import", ->

    before helpers.before
    after helpers.after

    describe 'ical helpers', ->

        describe 'get vCalendar string', ->
            it 'should return default vCalendar string', ->
                cal = new VCalendar 'Cozy Cloud', 'Cozy Agenda'
                cal.toString().should.equal """
                    BEGIN:VCALENDAR
                    VERSION:2.0
                    PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN
                    END:VCALENDAR""".replace(/\n/g, '\r\n')

        describe 'get vAlarm string', ->
            it 'should return default vAlarm string', ->
                date = new Date 2013, 5, 9, 15, 0, 0
                valarm = new VAlarm date
                valarm.toString().should.equal """
                    BEGIN:VALARM
                    ACTION:DISPLAY
                    REPEAT:1
                    TRIGGER:20130609T150000Z
                    END:VALARM""".replace(/\n/g, '\r\n')

        describe 'get vTodo string', ->
            it 'should return default vTodo string', ->
                date = new Date 2013, 5, 9, 15, 0, 0
                vtodo = new VTodo date, "superuser", "ma description"
                vtodo.toString().should.equal """
                    BEGIN:VTODO
                    DTSTAMP:20130609T150000Z
                    SUMMARY:ma description
                    UID:superuser
                    END:VTODO""".replace(/\n/g, '\r\n')

        describe 'get vEvent string', ->
            it 'should return default vEvent string', ->
                startDate = new Date 2013, 5, 9, 15, 0, 0
                endDate = new Date 2013, 5, 10, 15, 0, 0
                vevent = new VEvent startDate, endDate, "desc", "loc", "eid"
                vevent.toString().should.equal """
                    BEGIN:VEVENT
                    DESCRIPTION:desc
                    DTSTART:20130609T150000Z
                    DTEND:20130610T150000Z
                    LOCATION:loc
                    UID:eid
                    END:VEVENT""".replace(/\n/g, '\r\n')


        describe 'get vCalendar with alarms', ->
            it 'should return ical string', ->
                date = new Date 2013, 5, 9, 15, 0, 0
                cal = new VCalendar 'Cozy Cloud', 'Cozy Agenda'
                vtodo = new VTodo date, 'superuser', 'ma description'
                vtodo.addAlarm date
                cal.add vtodo
                cal.toString().should.equal """
                    BEGIN:VCALENDAR
                    VERSION:2.0
                    PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN
                    BEGIN:VTODO
                    DTSTAMP:20130609T150000Z
                    SUMMARY:ma description
                    UID:superuser
                    BEGIN:VALARM
                    ACTION:DISPLAY
                    REPEAT:1
                    TRIGGER:20130609T150000Z
                    END:VALARM
                    END:VTODO
                    END:VCALENDAR""".replace(/\n/g, '\r\n')

        describe 'parse ical file', ->
            it 'should return a well formed vCalendar object', (done) ->
                parser = new ICalParser
                parser.parseFile 'test/calendar.ics', (err, result) ->
                    should.not.exist err
                    #result.toString().should.equal expectedContent
                    done()


    describe 'Models', ->
        Alarm = Event = null
        before -> {Alarm, Event} = @models

        describe 'Alarms', ->


            it 'getICalCalendar', ->
                cal = Alarm.getICalCalendar()
                cal.toString().should.equal """
                    BEGIN:VCALENDAR
                    VERSION:2.0
                    PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN
                    END:VCALENDAR""".replace(/\n/g, '\r\n')

            it 'toIcal', ->
                alarm = new Alarm
                    id: "testid"
                    action: "EMAIL"
                    description: "Something else to remind"
                    trigg: "Tue Apr 24 2013 13:30:00"
                    timezone: "Europe/Paris"
                alarm.toIcal().toString().should.equal """
                    BEGIN:VTODO
                    DTSTAMP:20130424T133000Z
                    SUMMARY:Something else to remind
                    UID:testid
                    BEGIN:VALARM
                    ACTION:DISPLAY
                    REPEAT:1
                    TRIGGER:20130424T133000Z
                    END:VALARM
                    END:VTODO""".replace(/\n/g, '\r\n')

            it 'fromIcal', ->
                date = new Date 2013, 5, 9, 15, 0, 0
                user = 'user'
                description = 'description'
                vtodo = new VTodo date, user, description
                alarm = Alarm.fromIcal vtodo
                alarm.description.should.equal description
                alarm.trigg.should.equal "Sun Jun 09 2013 15:00:00"

            it 'extractAlarms', ->
                cal = Alarm.getICalCalendar()
                date = new Date 2013, 5, 9, 15, 0, 0
                user = 'user'
                description = 'description'
                cal.add new VTodo date, user, description
                date2 = new Date 2013, 5, 9, 18, 0, 0
                user2 = 'user2'
                description2 = 'description2'
                cal.add new VTodo date2, user2, description2
                alarms = Alarm.extractAlarms cal
                alarms[0].description.should.equal description
                alarms[0].trigg.should.equal "Sun Jun 09 2013 15:00:00"
                alarms[1].description.should.equal description2
                alarms[1].trigg.should.equal "Sun Jun 09 2013 18:00:00"

        describe 'Events', ->
            it 'toIcal', ->
                event = new Event
                    id: "testid"
                    place: "my place"
                    description: "my description"
                    start: "Tue Apr 24 2013 13:30:00"
                    end: "Fri Apr 25 2013 13:30:00"
                event.toIcal().toString().should.equal """
                    BEGIN:VEVENT
                    DESCRIPTION:my description
                    DTSTART:20130424T133000Z
                    DTEND:20130425T133000Z
                    LOCATION:my place
                    UID:testid
                    END:VEVENT""".replace(/\n/g, '\r\n')

            it 'fromIcal', ->
                start = new Date 2013, 5, 9, 15, 0, 0
                end = new Date 2013, 5, 10, 15, 0, 0
                location = 'my place'
                description = 'description'
                vEvent = new VEvent start, end, description, location
                event = Event.fromIcal vEvent
                event.description.should.equal description
                event.place.should.equal location
                event.start.should.equal "Sun Jun 09 2013 15:00:00"
                event.end.should.equal "Mon Jun 10 2013 15:00:00"

            it 'extractEvents', ->
                cal = Alarm.getICalCalendar()
                start = new Date 2013, 5, 9, 15, 0, 0
                end = new Date 2013, 5, 10, 15, 0, 0
                location = 'my place'
                description = 'description'
                cal.add new VEvent start, end, description, location
                start2 = new Date 2013, 5, 10, 15, 0, 0
                end2 = new Date 2013, 5, 11, 15, 0, 0
                location2 = 'my place2'
                description2 = 'description2'
                cal.add new VEvent start2, end2, description2, location2
                events = Event.extractEvents cal
                events[0].description.should.equal description
                events[0].place.should.equal location
                events[0].start.should.equal "Sun Jun 09 2013 15:00:00"
                events[0].end.should.equal "Mon Jun 10 2013 15:00:00"
                events[1].description.should.equal description2
                events[1].place.should.equal location2
                events[1].start.should.equal "Mon Jun 10 2013 15:00:00"
                events[1].end.should.equal "Tue Jun 11 2013 15:00:00"


    describe 'Resources', ->
        describe "GET /export/calendar.ics", ->

            ids = null
            before helpers.cleanDb
            before (done) ->
                async.series [
                    helpers.createAlarm("DISPLAY", "Something to remind",
                                        "Tue Apr 23 2013 14:40:00",
                                        "Europe/Paris")
                    helpers.createAlarm("EMAIL", "Something else to remind",
                                        "Tue Apr 24 2013 13:30:00",
                                        "Africa/Abidjan")
                    helpers.createAlarm("EMAIL", "Another thing to remind",
                                        "Tue Apr 25 2013 11:30:00",
                                        "Pacific/Apia")
                    helpers.createEvent("Sun Jun 09 2013 15:00:00",
                                        "Sun Jun 10 2013 15:00:00",
                                        "my place", "", "my description",
                                        "Indian/Cocos")
                ], (err, results) ->

                    ids = results.map (doc) -> doc.id

                    done()

            it "When I request for iCal export file", (done) ->
                client.get "export/calendar.ics", (error, response, body) =>
                    @body = body
                    done()
                , false

            it "Then it should contains my alarms", ->

                @body.should.equal expectedContent
                    .replace('[id-1]', ids[0])
                    .replace('[id-2]', ids[1])
                    .replace('[id-3]', ids[2])
                    .replace('[id-4]', ids[3])


        describe "POST /import/ical", ->

            it "When I send an iCal file to import", (done) ->
                client.sendFile "import/ical", "./test/calendar.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", (done) ->
                @body.alarms.length.should.equal 3
                @body.events.length.should.equal 1
                done()

            it "When I send an iCal file from Apple to import", (done) ->
                client.sendFile "import/ical", "./test/apple.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", (done) ->
                @body.alarms.length.should.equal 0
                @body.events.length.should.equal 2
                done()

            it "When I send an iCal file from Google to import", (done) ->
                client.sendFile "import/ical", "./test/google.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", (done) ->
                @body.alarms.length.should.equal 0
                @body.events.length.should.equal 2
                done()
