should = require 'should'
async = require 'async'
moment = require 'moment-timezone'
Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
clientDS = new Client 'http://localhost:9101'
helpers = require './helpers'

{ICalParser, VCalendar, VAlarm, VTodo, VEvent} = require 'cozy-ical'
# THIS TEST DUPPLICATE cozy-ical's
#@TODO : improve test there, remove here

expectedContent = """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cozy Cloud//NONSGML Cozy Agenda//EN
BEGIN:VTODO
UID:[id-1]
DTSTAMP:20141110T090600Z
DTSTART:20130423T124000Z
SUMMARY:Something to remind
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:PT0M
DESCRIPTION:Something to remind
END:VALARM
END:VTODO
BEGIN:VTODO
UID:[id-2]
DTSTAMP:20141110T090600Z
DTSTART:20130424T133000Z
SUMMARY:Something else to remind
BEGIN:VALARM
ACTION:EMAIL
TRIGGER:PT0M
ATTENDEE:mailto:mailto:test@cozycloud.cc
DESCRIPTION:Something else to remind
SUMMARY:Something else to remind
END:VALARM
END:VTODO
BEGIN:VTODO
UID:[id-3]
DTSTAMP:20141110T090600Z
DTSTART:20130425T113000Z
SUMMARY:Another thing to remind
BEGIN:VALARM
ACTION:EMAIL
TRIGGER:PT0M
ATTENDEE:mailto:mailto:test@cozycloud.cc
DESCRIPTION:Another thing to remind
SUMMARY:Another thing to remind
END:VALARM
END:VTODO
BEGIN:VEVENT
UID:[id-4]
DTSTAMP:20141110T090600Z
DTSTART:20130609T150000Z
DTEND:20130610T150000Z
LOCATION:my place
SUMMARY:my description
END:VEVENT
END:VCALENDAR
""".replace(/\n/g, '\r\n')

describe "Calendar export/import", ->

    before helpers.before
    after helpers.after

    describe 'Resources', ->
        describe "GET /export/calendar.ics", ->

            ids = null
            before helpers.cleanDb
            before (done) ->
                async.series [
                    helpers.createAlarm("DISPLAY", "Something to remind",
                                        "2013-04-23T12:40:00.000Z",
                                        "Europe/Paris")
                    helpers.createAlarm("EMAIL", "Something else to remind",
                                        "2013-04-24T13:30:00.000Z",
                                        "Africa/Abidjan")
                    helpers.createAlarm("EMAIL", "Another thing to remind",
                                        "2013-04-25T11:30:00.000Z",
                                        "Pacific/Apia")
                    helpers.createEvent("2013-06-09T15:00:00.000Z",
                                        "2013-06-10T15:00:00.000Z",
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
                dtstamp = moment.tz moment(), 'UTC'
                dtstampValue = "DTSTAMP:#{dtstamp.format 'YYYYMMDDTHHmm[00Z]'}"
                expectedBody = expectedContent
                    .replace '[id-1]', ids[0]
                    .replace '[id-2]', ids[1]
                    .replace '[id-3]', ids[2]
                    .replace '[id-4]', ids[3]
                    # DTSTAMP is new all the time in our implementation
                    .replace /DTSTAMP:.*/g, dtstampValue

                @body.should.equal expectedBody


        describe "POST /import/ical", ->

            it "When I send an iCal file to import", (done) ->
                client.sendFile "import/ical", "./test/calendar.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", (done) ->
                @body.alarms.length.should.equal 1
                @body.events.length.should.equal 3
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
