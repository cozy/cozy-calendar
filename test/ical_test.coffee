should = require('should')
async = require('async')
time = require 'time'
Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"

{VCalendar, VAlarm, VTodo} = require '../lib/ical_helpers'

instantiateApp = require('../server')
app = instantiateApp()


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

        describe 'get vTodo string', ->
        describe 'get vCalendar with alarms', ->

    describe "GET /calendar/:startDate/:endDate/calendar.ics", ->

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

        it "when I require iCal file from january, first 1970 to january" + \
           ", first 2015", (done) ->
            client.get "alarms/19700101/201501010/calendar.ics", \
                       (error, response, body) ->
                done()
        #it "then it should return an iCal compliant file with 3 " + \
            #"alarms", (done) ->
                #true.should.equal false
                #done()
