should = require('should')
async = require('async')
time = require 'time'
Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
helpers = require './helpers'

describe "Alarms management", ->

    before helpers.before
    after helpers.after

    describe "GET alarms/", ->

        before helpers.cleanDb
        before (done) ->
            async.series [
                helpers.createAlarm("DISPLAY", "Something to remind",
                                    "Tue Apr 23 2013 14:40:00 ")
                helpers.createAlarm("EMAIL", "Something else to remind",
                                    "Tue Apr 24 2013 13:30:00")
            ], done

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

        describe "Create alarm with the timezone of user", ->

            it "When I create an alarm", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "Tue Apr 23 2013 14:25:00"
                    description: 'Something to remind'
                    timezone: 'Europe/Paris'

                client.post "alarms/", @alarm, (error, response, body) =>

                    should.not.exist error
                    should.exist response
                    response.should.have.status 201
                    should.exist body

                    body.should.have.property 'id'
                    @alarm.id = body.id
                    body.should.have.property 'action', @alarm.action
                    body.should.have.property 'trigg'
                    body.should.have.property 'timezone', 'Europe/Paris'
                    body.trigg.should.equal @alarm.trigg
                    body.should.have.property 'description', @alarm.description
                    done()

            it "Then should have persisted the alarm into database", (done) ->

                helpers.getAlarmByID @alarm.id, (err, alarm) =>
                    should.not.exist err
                    should.exist alarm
                    alarm.should.have.property 'action', @alarm.action
                    exepectedDate = new time.Date(@alarm.trigg, 'Europe/Paris')
                    exepectedDate.setTimezone('UTC')
                    alarm.should.have.property 'trigg', exepectedDate.toString().slice(0, 24)
                    alarm.should.have.property 'description', @alarm.description

                    done()

            it "And should have only one item in the database", (done) ->

                helpers.getAllAlarms (err, alarms) =>

                    should.not.exist err
                    should.exist alarms
                    alarms.length.should.equal 1

                    done()

        describe "Create alarm with a timezone different than user timezone", ->

            it "When I post an alarm with America/Chicago as timezone", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "Tue Apr 23 2013 14:25:00"
                    description: 'Something to remind'
                    timezone: 'America/Chicago'

                client.post "alarms/", @alarm, (error, response, body) =>

                    should.not.exist error
                    should.exist response
                    response.should.have.status 201
                    should.exist body
                    body.should.have.property 'id'
                    @alarm.id = body.id
                    body.should.have.property 'action', @alarm.action
                    body.should.have.property 'trigg'
                    body.should.have.property 'timezone', 'America/Chicago'
                    trigg = new time.Date(@alarm.trigg, 'America/Chicago')
                    trigg.setTimezone 'Europe/Paris'
                    body.trigg.should.equal trigg.toString().slice(0, 24)
                    body.should.have.property 'description', @alarm.description
                    done()

            it "Then should have persisted the alarm into database", (done) ->

                helpers.getAlarmByID @alarm.id, (err, alarm) =>
                    should.not.exist err
                    should.exist alarm
                    alarm.should.have.property 'action', @alarm.action
                    exepectedDate = new time.Date(@alarm.trigg, 'America/Chicago')
                    exepectedDate.setTimezone('UTC')
                    alarm.should.have.property 'trigg', exepectedDate.toString().slice(0, 24)
                    alarm.should.have.property 'description', @alarm.description

                    done()

            it "And should have two items in the database", (done) ->

                helpers.getAllAlarms (err, alarms) =>

                    should.not.exist err
                    should.exist alarms
                    alarms.length.should.equal 2

                    done()

    describe "PUT alarms/:id", ->

        before helpers.cleanDb

        after ->
            delete @alarm

        describe "Update alarm with same timezone", ->

            it "When I create an alarm", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "Tue Apr 23 2013 14:25:00"
                    description: 'Something to remind'
                    timezone: 'Europe/Paris'
                helpers.createAlarmFromObject @alarm, (err, alarm) =>
                    @alarm.id = alarm.id
                    done()


            it "Then should return the alarm with the updated value", (done) ->

                @alarm.action = 'EMAIL'
                @alarm.trigg = "Tue Apr 23 2013 14:30:00"
                @alarm.description = 'Something updated to remind'
                @alarm.timezone = 'Europe/Paris'

                client.put "alarms/#{@alarm.id}", @alarm, (err, resp, body) =>

                    should.not.exist err
                    should.exist resp
                    resp.should.have.status 200
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
                    exepectedDate = new time.Date(@alarm.trigg, 'Europe/Paris')
                    exepectedDate.setTimezone('UTC')
                    alarm.should.have.property 'trigg', exepectedDate.toString().slice(0, 24)
                    alarm.should.have.property 'description', @alarm.description

                    done()

        describe "Update an alarm with an other timezone", ->

            it "When I create an alarm", (done) ->
                @alarm =
                    action: 'DISPLAY'
                    trigg: "Tue Apr 23 2013 14:25:00"
                    description: 'Something to remind'
                    timezone: 'America/Chicago'
                helpers.createAlarmFromObject @alarm, (err, alarm) =>
                    @alarm.id = alarm.id
                    done()


            it "Then should return the alarm with the updated value", (done) ->

                @alarm.action = 'EMAIL'
                @alarm.trigg = "Tue Apr 23 2013 14:30:00"
                @alarm.description = 'Something updated to remind'
                @alarm.timezone = 'Africa/Abidjan'

                client.put "alarms/#{@alarm.id}", @alarm, (err, resp, body) =>

                    should.not.exist err
                    should.exist resp
                    resp.should.have.status 200
                    should.exist body
                    body.should.have.property 'action', @alarm.action
                    trigg = new time.Date(@alarm.trigg, 'Africa/Abidjan')
                    trigg.setTimezone 'Europe/Paris'
                    body.should.have.property 'trigg', trigg.toString().slice(0, 24)
                    body.should.have.property 'description', @alarm.description
                    body.should.have.property 'timezone', @alarm.timezone
                    done()

            it "And should have persisted the alarm into database", (done) ->

                helpers.getAlarmByID @alarm.id, (err, alarm) =>
                    should.not.exist err
                    should.exist alarm
                    alarm.should.have.property 'action', @alarm.action
                    exepectedDate = new time.Date(@alarm.trigg, 'Africa/Abidjan')
                    exepectedDate.setTimezone('UTC')
                    alarm.should.have.property 'trigg', exepectedDate.toString().slice(0, 24)
                    alarm.should.have.property 'description', @alarm.description

                    done()

    describe "DELETE alarms/:id", ->

        before helpers.cleanDb
        after -> delete @alarm

        it "When I create an alarm", (done) ->
            @alarm =
                action: 'DISPLAY'
                trigg: "Tue Apr 23 2013 14:25:00"
                description: 'Something to remind'
                timezone: 'Europe/Paris'
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
