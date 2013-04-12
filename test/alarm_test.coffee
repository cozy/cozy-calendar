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

                should.not.exist error
                should.exist response
                should.exist body

                response.should.have.property 'statusCode'
                response.statusCode.should.equal 200
                body.length.should.equal 2
                done()

    describe "POST alarms/", ->

        before (done) =>
            helpers.cleanDb done
            @alarm =
                action: 'DISPLAY'
                trigg: '20130410T1500Z'
                description: 'Something to remind'

        it "should return the alarm json object", (done) =>

            client.post "alarms/", @alarm, (error, response, body) =>

                should.not.exist error
                should.exist response
                response.should.have.status 201
                should.exist body
                body.should.have.property 'id'
                @alarm.id = body.id
                body.should.have.property 'action', @alarm.action
                body.should.have.property 'trigg', @alarm.trigg
                body.should.have.property 'description', @alarm.description

                done()

        it "should have persisted the alarm into database", (done) =>

            helpers.getAlarmByID @alarm.id, (err, alarm) =>
                should.not.exist err
                should.exist alarm
                alarm.should.have.property 'action', @alarm.action
                alarm.should.have.property 'trigg', @alarm.trigg
                alarm.should.have.property 'description', @alarm.description

                done()

        it "should have only one item in the database", (done) =>

            helpers.getAllAlarms (err, alarms) =>

                should.not.exist err
                should.exist alarms
                alarms.length.should.equal 1

                done()

    describe "PUT alarms/:id", ->

        before (done) =>
            @alarm =
                action: 'DISPLAY'
                trigg: '20130410T1500Z'
                description: 'Something to remind'

            helpers.cleanDb =>
                helpers.createAlarmFromObject @alarm, (err, alarm) =>
                    @alarm.id = alarm.id
                    done()

        it "should return the alarm with the updated value", (done) =>

            @alarm.action = 'EMAIL'
            @alarm.trigg = '20130410T1530Z'
            @alarm.description = 'Something updated to remind'

            client.put "alarms/#{@alarm.id}", @alarm, (err, resp, body) =>

                should.not.exist err
                should.exist resp
                resp.should.have.status 200
                should.exist body
                body.should.have.property 'action', @alarm.action
                body.should.have.property 'trigg', @alarm.trigg
                body.should.have.property 'description', @alarm.description
                done()

        it "should have persisted the alarm into database", (done) =>

            helpers.getAlarmByID @alarm.id, (err, alarm) =>
                should.not.exist err
                should.exist alarm
                alarm.should.have.property 'action', @alarm.action
                alarm.should.have.property 'trigg', @alarm.trigg
                alarm.should.have.property 'description', @alarm.description

                done()

    describe "DELETE alarms/:id", ->
        it "should return the deleted alarm"
        it "should have removed the alarm from the database"