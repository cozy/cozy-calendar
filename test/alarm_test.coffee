should = require('should')
async = require('async')
time = require 'time'
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
                    helpers.createAlarm("DISPLAY", "Something to remind",
                                        "Tue Apr 23 2013 14:40:00 ")
                    helpers.createAlarm("EMAIL", "Something else to remind",
                                        "Tue Apr 24 2013 13:30:00")
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

        before (done) ->
            helpers.cleanDb done
        after ->
            delete alarm

        it "should return the alarm json object", (done) ->
            @alarm =
                action: 'DISPLAY'
                trigg: "Tue Apr 23 2013 14:25:00"
                description: 'Something to remind'

            client.post "alarms/", @alarm, (error, response, body) =>

                should.not.exist error
                should.exist response
                response.should.have.status 201
                should.exist body

                body.should.have.property 'id'
                @alarm.id = body.id
                body.should.have.property 'action', @alarm.action
                body.should.have.property 'trigg'
                body.trigg.should.eql @alarm.trigg
                body.should.have.property 'description', @alarm.description
                done()

        it "should have persisted the alarm into database", (done) ->

            helpers.getAlarmByID @alarm.id, (err, alarm) =>
                should.not.exist err
                should.exist alarm
                alarm.should.have.property 'action', @alarm.action
                exepectedDate = new time.Date(@alarm.trigg, 'Europe/Paris')
                exepectedDate.setTimezone('UTC')
                alarm.should.have.property 'trigg', exepectedDate.toString().slice(0, 24)
                alarm.should.have.property 'description', @alarm.description

                done()

        it "should have only one item in the database", (done) ->

            helpers.getAllAlarms (err, alarms) =>

                should.not.exist err
                should.exist alarms
                alarms.length.should.equal 1

                done()

    describe "PUT alarms/:id", ->

        before (done) =>
            helpers.cleanDb =>
                done()

        after ->
            delete alarm

        it "When I create an alarm", (done) ->
            @alarm =
                action: 'DISPLAY'
                trigg: "Tue Apr 23 2013 14:25:00"
                description: 'Something to remind'
            helpers.createAlarmFromObject @alarm, (err, alarm) =>
                @alarm.id = alarm.id
                done()


        it "should return the alarm with the updated value", (done) ->

            @alarm.action = 'EMAIL'
            @alarm.trigg = "Tue Apr 23 2013 14:30:00"
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

        it "should have persisted the alarm into database", (done) ->

            helpers.getAlarmByID @alarm.id, (err, alarm) =>
                should.not.exist err
                should.exist alarm
                alarm.should.have.property 'action', @alarm.action
                exepectedDate = new time.Date(@alarm.trigg, 'Europe/Paris')
                exepectedDate.setTimezone('UTC')
                alarm.should.have.property 'trigg', exepectedDate.toString().slice(0, 24)
                alarm.should.have.property 'description', @alarm.description

                done()

    describe "DELETE alarms/:id", ->

        before (done) ->
            helpers.cleanDb done

        after ->
            delete alarm

        it "When I create an alarm", (done) ->
            @alarm =
                action: 'DISPLAY'
                trigg: "Tue Apr 23 2013 14:25:00"
                description: 'Something to remind'
            helpers.createAlarmFromObject @alarm, (err, alarm) =>
                @alarm.id = alarm.id
                done()

        it "should return the deleted alarm", (done) ->

            client.del "alarms/#{@alarm.id}", (err, resp, body) =>
                should.not.exist err
                should.exist resp
                resp.should.have.status 200

                done()

        it "should have removed the alarm from the database", (done) ->

            helpers.doesAlarmExist @alarm.id, (err, isExist) ->
                should.not.exist err
                should.exist isExist
                isExist.should.be.false
                done()
