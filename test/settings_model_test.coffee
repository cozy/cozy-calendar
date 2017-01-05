should = require 'should'

helpers = require './helpers'
Settings = require '../server/models/settings'


describe "Settings model", ->

    beforeEach helpers.cleanDb
    afterEach helpers.cleanDb

    it "getCalAppSettings - with no previous calendar", (done) ->
        Settings.getCalAppSettings (err, calendarSettings) ->
            should.ifError err
            calendarSettings.app.should.equal 'calendar'
            calendarSettings.defaultCalendar.should.equal ''
            done()

    it "getCalAppSettings - with previous calendar", (done) ->
        settings =
           app: 'calendar'
           defaultCalendar: 'Meetups'

        Settings.create settings, (err) ->
            should.ifError err

            Settings.getCalAppSettings (err, calendarSettings) ->
                should.ifError err
                calendarSettings.app.should.equal 'calendar'
                calendarSettings.defaultCalendar.should.equal 'Meetups'
                done()

    it "updateForCalendar", (done) ->
        settings =
            defaultCalendar: 'Meetups'

        Settings.updateCalAppSettings settings, (err, calendarSettings) ->
            should.ifError err
            calendarSettings.app.should.equal 'calendar'
            calendarSettings.defaultCalendar.should.equal 'Meetups'

            Settings.getCalAppSettings (err, calendarSettings) ->
                should.ifError err
                calendarSettings.app.should.equal 'calendar'
                calendarSettings.defaultCalendar.should.equal 'Meetups'
                done()
