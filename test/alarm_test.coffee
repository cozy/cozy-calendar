should = require 'should'
async = require 'async'
moment = require 'moment-timezone'
Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
helpers = require './helpers'

describe "Alarms management", ->

    before helpers.before
    after helpers.after

    describe "GET alarms/", ->

        before helpers.cleanDb
        before helpers.createAlarm("DISPLAY", "Something to remind",
                                    "2013-04-23T14:40:00.000Z", "Europe/Paris")
        before helpers.createAlarm("EMAIL", "Something else to remind",
                                    "2013-04-23T13:30:00.000Z")

        it "should return all the alarms in database", (done) ->
            client.get "alarms/", (error, response, body) ->
                should.not.exist error
                should.exist response
                should.exist body

                response.should.have.property 'statusCode'
                response.statusCode.should.equal 200
                body.length.should.equal 2
                body[0].timezone.should.equal 'Europe/Paris'
                done()

    describe "POST alarms/", ->

        before helpers.cleanDb
        after ->
            delete @alarm

        describe "Create alarm", ->

            it "When I create an alarm", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "2013-04-23T14:25:00.000Z"
                    description: 'Something to remind'

                client.post "alarms/", @alarm, (error, response, body) =>
                    should.not.exist error
                    should.exist response
                    response.should.have.property 'statusCode', 201
                    should.exist body

                    body.should.have.property 'id'
                    @alarm.id = body.id
                    body.should.have.property 'action', @alarm.action
                    body.should.have.property 'trigg'
                    body.trigg.should.equal @alarm.trigg
                    body.should.have.property 'description', @alarm.description
                    done()

            it "Then should have persisted the alarm into database", (done) ->

                helpers.getAlarmByID @alarm.id, (err, alarm) =>
                    should.not.exist err
                    should.exist alarm
                    alarm.should.have.property 'action', @alarm.action
                    exepectedDate = moment.tz @alarm.trigg, 'UTC'
                    alarm.should.have.property 'trigg'
                    moment.tz(alarm.trigg, 'UTC').format().should.equal exepectedDate.format()
                    alarm.should.have.property 'description', @alarm.description

                    done()

            it "And should have only one item in the database", (done) ->

                helpers.getAllAlarms (err, alarms) =>

                    should.not.exist err
                    should.exist alarms
                    alarms.length.should.equal 1

                    done()

            it "When I create the same alarm in import mode", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "2013-04-23T14:25:00.000Z"
                    description: 'Something to remind'
                    import: true

                client.post "alarms/", @alarm, (error, response, body) =>
                    should.not.exist error
                    should.exist response
                    response.should.have.property 'statusCode', 201
                    should.exist body

                    done()

            it "Then no new alarm is created in the database", (done) ->

                helpers.getAllAlarms (err, alarms) =>

                    should.not.exist err
                    should.exist alarms
                    alarms.length.should.equal 1

                    done()

            it "When I create the same alarm not in import mode", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "2013-04-23T14:25:00.000Z"
                    description: 'Something to remind'

                client.post "alarms/", @alarm, (error, response, body) =>
                    should.not.exist error
                    should.exist response
                    response.should.have.property 'statusCode', 201
                    should.exist body

                    done()

            it "Then a new alarm is created in the database", (done) ->

                helpers.getAllAlarms (err, alarms) =>

                    should.not.exist err
                    should.exist alarms
                    alarms.length.should.equal 2

                    done()

    describe "PUT alarms/:id", ->

        before helpers.cleanDb

        after ->
            delete @alarm

        describe "Update alarm", ->

            it "When I create an alarm", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "2013-04-23T14:25:00.000Z"
                    description: 'Something to remind'
                helpers.createAlarmFromObject @alarm, (err, alarm) =>
                    @alarm.id = alarm.id
                    done()

            it "Then should return the alarm with the updated value", (done) ->

                @alarm.action = 'EMAIL'
                @alarm.trigg = "2013-04-23T14:30:00.000Z"
                @alarm.description = 'Something updated to remind'

                client.put "alarms/#{@alarm.id}", @alarm, (err, resp, body) =>

                    should.not.exist err
                    should.exist resp
                    resp.should.have.property 'statusCode', 200
                    should.exist body
                    body.should.have.property 'action', @alarm.action
                    body.should.have.property 'trigg', @alarm.trigg
                    body.should.have.property 'description', @alarm.description
                    done()

            it "And should have persisted the alarm into database", (done) ->

                helpers.getAlarmByID @alarm.id, (err, alarm) =>
                    should.not.exist err
                    should.exist alarm
                    alarm.should.have.property 'action', @alarm.action
                    exepectedDate = moment.tz @alarm.trigg, 'UTC'
                    alarm.should.have.property 'trigg'
                    moment.tz(alarm.trigg, 'UTC').format().should.equal exepectedDate.format()
                    alarm.should.have.property 'description', @alarm.description

                    done()

    describe "DELETE alarms/:id", ->

        before helpers.cleanDb
        after -> delete @alarm

        it "When I create an alarm", (done) ->
            @alarm =
                action: 'DISPLAY'
                trigg: "2013-04-23T14:25:00.000Z"
                description: 'Something to remind'

            helpers.createAlarmFromObject @alarm, (err, alarm) =>
                @alarm.id = alarm.id
                done()

        it "should return the deleted alarm", (done) ->

            client.del "alarms/#{@alarm.id}", (err, resp, body) =>
                should.not.exist err
                should.exist resp
                resp.should.have.property 'statusCode', 200

                done()

        it "should have removed the alarm from the database", (done) ->

            helpers.doesAlarmExist @alarm.id, (err, isExist) ->
                should.not.exist err
                should.exist isExist
                isExist.should.be.false
                done()
