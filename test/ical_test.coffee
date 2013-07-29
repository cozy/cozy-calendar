should = require('should')
async = require('async')
time = require 'time'
Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

{ICalParser, VCalendar, VAlarm, VTodo} = require '../lib/ical_helpers'

instantiateApp = require('../server')
app = instantiateApp()

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
END:VCALENDAR
""".replace(/\n/g, '\r\n')



helpers = null
describe "Alarms management", ->

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


    describe "GET /export/calendar.ics", ->

        before (done) ->
            initDb = (callback) ->
                async.series [
                    helpers.createAlarm("DISPLAY", "Something to remind",
                                        "Tue Apr 23 2013 14:40:00 ")
                    helpers.createAlarm("EMAIL", "Something else to remind",
                                        "Tue Apr 24 2013 13:30:00")
                    helpers.createAlarm("EMAIL", "Another thing to remind",
                                        "Tue Apr 25 2013 11:30:00")
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


    describe "POST /import/ical", ->

        it "when I send an iCal import file", (done) ->
            client.sendFile "import/ical", "./test/calendar.ics", (err, res, body) =>
                should.not.exist err
                res.statusCode.should.equal 200
                @body = body
                done()

        it "Then it sends to me the parsing result", (done) ->
            console.log @body
            console.log @body.alarms
            console.log @body.alarms.length
            @body.alarms.length.should.equal 3
            done()

        it "When I confirm the import", ->
