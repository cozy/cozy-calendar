should = require 'should'
async = require 'async'
moment = require '../server/libs/moment'
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
PRODID:-//Cozy//NONSGML Cozy Calendar//EN
X-WR-CALNAME:my calendar
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
        describe "GET /export/my calendar.ics", ->

            ids = null
            before helpers.cleanDb
            before (done) ->
                async.series [
                    helpers.createEvent("2013-06-09T15:00:00.000Z",
                                        "2013-06-10T15:00:00.000Z",
                                        "my place", "my description",
                                        "Indian/Cocos")
                ], (err, results) ->
                    ids = results.map (doc) -> doc.id
                    done()

            it "When I request for iCal export file", (done) ->
                client.get "export/my%20calendar.ics", (error, response, body) =>
                    @body = body
                    done()
                , false

            it "Then it should contains my event", ->
                dtstamp = moment.tz moment(), 'UTC'
                dtstampValue = "DTSTAMP:#{dtstamp.format 'YYYYMMDDTHHmmss[Z]'}"
                expectedBody = expectedContent
                    .replace '[id-4]', ids[0]
                    # DTSTAMP is new all the time in our implementation
                    .replace /DTSTAMP:.*/g, dtstampValue

                @body.should.equal expectedBody


        describe "POST /import/ical the calendar name is found in iCal", ->

            it "When I send an iCal file to import", (done) ->
                client.sendFile "import/ical", "./test/calendar.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", ->
                @body.events.length.should.equal 3

            it "It should have the default calendar name", ->
                should.exist @body.calendar
                @body.calendar.should.have.property 'name', 'my calendar'

            it "When I send an iCal file from Apple to import", (done) ->
                client.sendFile "import/ical", "./test/apple.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", ->
                @body.events.length.should.equal 2

            it "It should have the default calendar name", ->
                should.exist @body.calendar
                @body.calendar.should.have.property 'name', 'my calendar'

            it "When I send an iCal file from Google to import", (done) ->
                client.sendFile "import/ical", "./test/google.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", ->
                @body.events.length.should.equal 2

            it "It should have the calendar name from the file", ->
                should.exist @body.calendar
                @body.calendar.should.have.property 'name', 'random.test@gmail.com'

        describe "POST /import/ical the calendar name is not found, with existing events", ->
            before helpers.cleanDb
            after helpers.cleanDb

            it "Given there are existing tags", (done) ->
                rawEvent =
                    description: 'Something to do'
                    start: "2013-04-25T15:30:00.000Z"
                    end: "2013-04-25T18:30:00.000Z"
                    place: "place"
                    tags: ['zsomething']
                rawEvent2 =
                    description: 'Something to do'
                    start: "2013-04-25T18:30:00.000Z"
                    end: "2013-04-25T19:30:00.000Z"
                    place: "place"
                    tags: ['asomething']
                helpers.createEventFromObject rawEvent, ->
                    helpers.createEventFromObject rawEvent2, ->
                        done()

            it "When I send an iCal file to import", (done) ->
                client.sendFile "import/ical", "./test/calendar.ics", (err, res, body) =>
                    should.not.exist err
                    res.statusCode.should.equal 200
                    @body = JSON.parse body
                    done()

            it "Then it sends to me the parsing result", ->
                @body.events.length.should.equal 3

            it "It should have the first calendar name by alphabetical order", ->
                should.exist @body.calendar
                @body.calendar.should.have.property 'name', 'asomething'
