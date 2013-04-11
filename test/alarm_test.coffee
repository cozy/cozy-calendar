should = require('should')
async = require('async')
Client = require('request-json').JsonClient
instantiateApp = require('../server')
app = instantiateApp()

client = new Client "http://localhost:8888/"

helpers = null
describe "Alarms management", ->

    before ->
        app.listen 8888
        helpers = require("./helpers")(app.compound)

    after ->
        app.compound.server.close()

    describe "GET alarms/", ->

        before (done) ->
            initDb = (callback) ->
                async.series [
                    helpers.createAlarm "DISPLAY", "Something to remind", "20130410T1500Z"
                    helpers.createAlarm "EMAIL", "Something else to remind", "20130412T1630Z"
                ], ->
                    callback()
            helpers.cleanDb ->
                initDb done

        it "should return all the alarms in database", (done) ->
            client.get "alarms/", (error, response, body) ->
                response.statusCode.should.equal 200
                body.length.should.equal 2
                done()

    describe "POST alarms/", ->

        before (done) ->
            helpers.cleanDb done
            @alarm =
                action: 'DISPLAY'
                trigg: '20130410T1500Z'
                description: 'Something to remind'

        it "should return the alarm json object", (done) ->

            client.post "alarms/", @alarm, (error, response, body) =>

                should.exist response
                response.statusCode.should.equal 201
                should.exist body
                should.exist body.action
                should.exist body.trigg
                should.exist body.description

                body.action.should.equal @alarm.action
                body.trigg.should.equal @alarm.trigg
                body.description.should.equal @alarm.description

                done()

        it "should have persisted the alarm into database", (done) ->
            helpers.getAllAlarms (err, alarms) =>
                should.exist alarms
                alarms.length.should.equal 1
                should.exist alarms[0].action
                should.exist alarms[0].trigg
                should.exist alarms[0].description
                alarms[0].action.should.equal @alarm.action
                alarms[0].trigg.should.equal @alarm.trigg
                alarms[0].description.should.equal @alarm.description
                done()

    describe "PUT alarms/:id", ->
        it "should return the alarm with the updated value"
        it "should have persisted the alarm into database"

    describe "DELETE alarms/:id", ->
        it "should return the deleted alarm"
        it "should have removed the alarm from the database"