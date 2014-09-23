should = require('should')
async = require('async')
time = require 'time'
Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
helpers = require './helpers'

describe "Events management", ->

    before helpers.before
    after helpers.after

    describe "GET events/", ->

        before helpers.cleanDb
        before helpers.createEvent "Tue Apr 23 2013 14:40:00 ",
                    "Tue Apr 23 2013 15:40:00 ", "Place", 3,
                    "Something to do"
        before helpers.createEvent "Tue Apr 24 2013 13:30:00",
                    "Tue Apr 24 2013 14:00:00", "Other place", 0,
                    "Something else to do"

        it "should return all the events in database", (done) ->
            client.get "events/", (error, response, body) ->

                should.not.exist error
                should.exist response
                should.exist body

                response.should.have.property 'statusCode'
                response.statusCode.should.equal 200
                body.length.should.equal 2
                done()

    describe "POST events/", ->

        before helpers.cleanDb
        after -> delete @event

        it "should return the event json object", (done) ->
            @event =
                description: 'Title'
                start: "Tue Apr 15 2013 15:30:00"
                end:"Tue Apr 15 2013 16:30:00"
                place: "place"
                diff: 0

            client.post "events/", @event, (error, response, body) =>

                should.not.exist error
                should.exist response
                response.should.have.status 201
                should.exist body

                body.should.have.property 'id'
                @event.id = body.id
                body.should.have.property 'start'
                body.should.have.property 'end'
                body.should.have.property 'description', @event.description
                body.should.have.property 'place', @event.place
                body.should.have.property 'diff', @event.diff
                done()

        it "should have persisted the event into database", (done) ->

            helpers.getEventByID @event.id, (err, event) =>
                should.not.exist err
                should.exist event

                exepectedDate = new time.Date(@event.start, 'Europe/Paris')
                exepectedDate.setTimezone('UTC')
                event.should.have.property 'start',
                    exepectedDate.toString().slice(0, 24)

                exepectedDate = new time.Date(@event.end, 'Europe/Paris')
                exepectedDate.setTimezone('UTC')
                event.should.have.property 'end',
                    exepectedDate.toString().slice(0, 24)

                event.should.have.property 'description', @event.description
                event.should.have.property 'place', @event.place
                event.should.have.property 'diff', @event.diff
                done()

        it "should have only one item in the database", (done) ->

            helpers.getAllEvents (err, events) =>

                should.not.exist err
                should.exist events
                events.length.should.equal 1

                done()

        it "should do nothing in import mode when an event with " + \
           "same start data already exists", (done) ->
            @event =
                description: 'Title'
                start: "Tue Apr 15 2013 15:30:00"
                end:"Tue Apr 15 2013 16:30:00"
                place: "place"
                diff: 0
                import: true

            client.post "events/", @event, (error, response, body) =>

                helpers.getAllEvents (err, events) =>

                    should.not.exist err
                    should.exist events
                    events.length.should.equal 1

                    done()

        it "should create an event when not in import mode and when an " + \
           "event with same start data already exists", (done) ->
            @event =
                description: 'Title'
                start: "Tue Apr 15 2013 15:30:00"
                end:"Tue Apr 15 2013 16:30:00"
                place: "place"
                diff: 0

            client.post "events/", @event, (error, response, body) =>

                helpers.getAllEvents (err, events) =>

                    should.not.exist err
                    should.exist events
                    events.length.should.equal 2

                    done()


    describe "PUT events/:id", ->

        before helpers.cleanDb
        after -> delete @event


        it "When I create an event", (done) ->
            @event =
                description: 'Something to do'
                start: "Tue Apr 25 2013 15:30:00"
                end: "Tue Apr 25 2013 18:30:00"
                place: "place"
                diff: 0
            helpers.createEventFromObject @event, (err, event) =>
                @event.id = event.id
                done()

        it "should return the event with the updated value", (done) ->

            @event.start = "Tue Apr 25 2013 16:30:00"
            @event.end = "Tue Apr 25 2013 19:30:00"
            @event.description = 'Something updated to do'
            @event.place = "other place"
            @event.diff = 1

            client.put "events/#{@event.id}", @event, (err, resp, body) =>

                should.not.exist err
                should.exist resp
                resp.should.have.status 200
                should.exist body
                body.should.have.property 'start'
                body.should.have.property 'end'
                body.should.have.property 'description', @event.description
                body.should.have.property 'place', @event.place
                body.should.have.property 'diff', @event.diff
                done()

        it "should have persisted the event into database", (done) ->

            helpers.getEventByID @event.id, (err, event) =>
                should.not.exist err
                should.exist event

                exepectedDate = new time.Date(@event.start, 'Europe/Paris')
                exepectedDate.setTimezone('UTC')
                event.should.have.property 'start',
                    exepectedDate.toString().slice(0, 24)

                exepectedDate = new time.Date(@event.end, 'Europe/Paris')
                exepectedDate.setTimezone('UTC')
                event.should.have.property 'end',
                    exepectedDate.toString().slice(0, 24)

                event.should.have.property 'description', @event.description
                event.should.have.property 'place', @event.place
                event.should.have.property 'diff', @event.diff

                done()

    describe "DELETE events/:id", ->

        before helpers.cleanDb
        after -> delete @event

        it "When I create an event", (done) ->
            @event =
                description: 'Something to do'
                start: "Tue Apr 25 2013 15:30:00"
                end: "Tue Apr 25 2013 18:30:00"
                place: "place"
                diff: 0
            helpers.createEventFromObject @event, (err, event) =>
                @event.id = event.id
                done()

        it "should return the deleted event", (done) ->
            client.del "events/#{@event.id}", (err, resp, body) =>
                should.not.exist err
                should.exist resp
                resp.should.have.status 200

                done()

        it "should have removed the event from the database", (done) ->

            helpers.doesEventExist @event.id, (err, isExist) ->
                should.not.exist err
                should.exist isExist
                isExist.should.be.false
                done()
