should = require('should')
async = require('async')
time = require 'time'
Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

{ICalParser, VCalendar, VAlarm, VTodo, VEvent} = require '../lib/ical_helpers'

instantiateApp = require('../server')
app = instantiateApp()

Alarm = null
Event = null
app.compound.on 'models', (models, compound) ->
    Event = compound.models.Event
    Alarm = compound.models.Alarm

expectedContent = """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN
BEGIN:VTODO
DSTAMP:20130423T144000
SUMMARY:Something to remind
UID:undefined
BEGIN:VALARM
ACTION:AUDIO
REPEAT:1
TRIGGER:20130423T144000
END:VALARM
END:VTODO
BEGIN:VTODO
DSTAMP:20130424T133000
SUMMARY:Something else to remind
UID:undefined
BEGIN:VALARM
ACTION:AUDIO
REPEAT:1
TRIGGER:20130424T133000
END:VALARM
END:VTODO
BEGIN:VTODO
DSTAMP:20130425T113000
SUMMARY:Another thing to remind
UID:undefined
BEGIN:VALARM
ACTION:AUDIO
REPEAT:1
TRIGGER:20130425T113000
END:VALARM
END:VTODO
BEGIN:VEVENT
DESCRIPTION:my description
DTSTART:20130609T150000
DTEND:20130610T150000
LOCATION:my place
END:VEVENT
END:VCALENDAR
""".replace(/\n/g, '\r\n')



helpers = null
describe "Calendar export/import", ->

    before ->
        app.listen 8888
        helpers = require("./helpers")(app.compound)

    after ->
        app.compound.server.close()


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
ACTION:AUDIO
REPEAT:1
TRIGGER:20130609T150000
END:VALARM""".replace(/\n/g, '\r\n')

        describe 'get vTodo string', ->
            it 'should return default vTodo string', ->
                date = new Date 2013, 5, 9, 15, 0, 0
                vtodo = new VTodo date, "superuser", "ma description"
                vtodo.toString().should.equal """
BEGIN:VTODO
DSTAMP:20130609T150000
SUMMARY:ma description
UID:superuser
END:VTODO""".replace(/\n/g, '\r\n')

        describe 'get vEvent string', ->
            it 'should return default vEvent string', ->
                startDate = new Date 2013, 5, 9, 15, 0, 0
                endDate = new Date 2013, 5, 10, 15, 0, 0
                vevent = new VEvent startDate, endDate, "desc", "loc"
                vevent.toString().should.equal """
BEGIN:VEVENT
DESCRIPTION:desc
DTSTART:20130609T150000
DTEND:20130610T150000
LOCATION:loc
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
DSTAMP:20130609T150000
SUMMARY:ma description
UID:superuser
BEGIN:VALARM
ACTION:AUDIO
REPEAT:1
TRIGGER:20130609T150000
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
                    action: "EMAIL"
                    description: "Something else to remind"
                    trigg: "Tue Apr 24 2013 13:30:00"
                alarm.toIcal().toString().should.equal """
BEGIN:VTODO
DSTAMP:20130424T133000
SUMMARY:Something else to remind
UID:undefined
BEGIN:VALARM
ACTION:AUDIO
REPEAT:1
TRIGGER:20130424T133000
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
            it 'fromIcal', ->
            it 'extractEvents', ->

    describe 'Resources', ->
        describe "GET /export/calendar.ics", ->
            before (done) ->
                initDb = (callback) ->
                    async.series [
                        helpers.createAlarm("DISPLAY", "Something to remind",
                                            "Tue Apr 23 2013 14:40:00")
                        helpers.createAlarm("EMAIL", "Something else to remind",
                                            "Tue Apr 24 2013 13:30:00")
                        helpers.createAlarm("EMAIL", "Another thing to remind",
                                            "Tue Apr 25 2013 11:30:00")
                        helpers.createEvent("Sun Jun 09 2013 15:00:00",
                                            "Sun Jun 10 2013 15:00:00",
                                            "my place", "", "my description")
                    ], ->
                        callback()
                helpers.cleanDb ->
                    initDb done

            it "when I request for iCal export file", (done) ->
                client.get "export/calendar.ics", (error, response, body) =>
                    @body = body
                    done()
                , false

            it "Then it should contains my alarms", ->
                @body.should.equal expectedContent


        #describe "POST /import/ical", ->

            #it "when I send an iCal import file", (done) ->
                #client.sendFile "import/ical", "./test/calendar.ics", (err, res, body) =>
                    #should.not.exist err
                    #res.statusCode.should.equal 200
                    #@body = body
                    #done()

            #it "Then it sends to me the parsing result", (done) ->
                #console.log @body
                #console.log @body.alarms
                #console.log @body.alarms.length
                #@body.alarms.length.should.equal 3
                #done()

            #it "When I confirm the import", ->
