should = require 'should'
async = require 'async'
request = require 'request-json'
helpers = require './helpers'
Settings = require '../server/models/settings'


describe "Settings routes", ->
    client = request.createClient "http://localhost:8888/"

    before helpers.before
    after helpers.after

    beforeEach helpers.cleanDb
    afterEach helpers.cleanDb

    it "PUT settings/ - good data", (done) ->
        newSettings =
            defaultCalendar: 'Meetups'
        client.put 'settings', newSettings, (err, res, body) ->
            should.ifError err
            body.success.should.be.ok
            body.settings.defaultCalendar.should.equal(
                newSettings.defaultCalendar
            )

            Settings.getCalAppSettings (err, calendarSettings) ->
                should.ifError err
                calendarSettings.defaultCalendar.should.equal(
                    newSettings.defaultCalendar
                )
                done()

    it "PUT settings/ - empty data", (done) ->
        newSettings =
            other: 'test'
        client.put 'settings', newSettings, (err, res, body) ->
            should.ifError err
            res.statusCode.should.equal 400
            body.success.should.not.be.ok
            done()

    it "PUT settings/ - wrong data", (done) ->
        newSettings =
            defaultCalendar: 123
        client.put 'settings', newSettings, (err, res, body) ->
            should.ifError err
            res.statusCode.should.equal 400
            body.success.should.not.be.ok
            done()
