should = require 'should'
async = require 'async'
moment = require 'moment-timezone'
Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
helpers = require './helpers'


describe "Events management", ->

    before helpers.before
    after helpers.after

    describe "GET events/", ->

        before helpers.cleanDb
        before helpers.createEvent "2013-04-23T14:40:00.000Z",
                    "2013-04-23T15:40:00.000Z", "Place", 3,
                    "Something to do"
        before helpers.createEvent "2013-04-24T13:30:00.000Z",
                    "2013-04-24T14:00:00.000Z", "Other place", 0,
                    "Something else to do"

        it "should return all the events in database", (done) ->
            client.get "events/", (error, response, body) ->

                should.not.exist error
                should.exist response
                should.exist body

                response.should.have.property 'statusCode', 200
                body.length.should.equal 2
                done()

    describe "POST events/", ->

        before helpers.cleanDb
        after -> delete @event

        it "should return the event json object", (done) ->
            @event =
                description: 'Title'
                start: "2013-04-15T15:30:00.000Z"
                end: "2013-04-15T16:30:00.000Z"
                place: "place"

            client.post "events/", @event, (error, response, body) =>

                should.not.exist error
                should.exist response
                response.should.have.property 'statusCode', 201
                should.exist body

                body.should.have.property 'id'
                @event.id = body.id
                body.should.have.property 'start'
                body.should.have.property 'end'
                body.should.have.property 'description', @event.description
                body.should.have.property 'place', @event.place
                done()

        it "should have persisted the event into database", (done) ->

            helpers.getEventByID @event.id, (err, event) =>
                should.not.exist err
                should.exist event

                event.should.have.property 'start', @event.start
                event.should.have.property 'end', @event.end
                event.should.have.property 'description', @event.description
                event.should.have.property 'place', @event.place
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
                start: "2013-04-15T15:30:00.000Z"
                end: "2013-04-15T16:30:00.000Z"
                place: "place"
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
                start: "2013-04-15T15:30:00.000Z"
                end: "2013-04-15T16:30:00.000Z"
                place: "place"

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
                start: "2013-04-25T15:30:00.000Z"
                end: "2013-04-25T18:30:00.000Z"
                place: "place"
            helpers.createEventFromObject @event, (err, event) =>
                @event.id = event.id
                done()

        it "should return the event with the updated value", (done) ->

            @event.start = "2013-04-25T16:30:00.000Z"
            @event.end = "2013-04-25T19:30:00.000Z"
            @event.description = 'Something updated to do'
            @event.place = "other place"

            client.put "events/#{@event.id}", @event, (err, resp, body) =>

                should.not.exist err
                should.exist resp
                resp.should.have.property 'statusCode', 200
                should.exist body
                body.should.have.property 'start'
                body.should.have.property 'end'
                body.should.have.property 'description', @event.description
                body.should.have.property 'place', @event.place
                done()

        it "should have persisted the event into database", (done) ->

            helpers.getEventByID @event.id, (err, event) =>
                should.not.exist err
                should.exist event

                event.should.have.property 'start', @event.start
                event.should.have.property 'end', @event.end
                event.should.have.property 'description', @event.description
                event.should.have.property 'place', @event.place
                done()

    describe "PUT events/:id - Add guest to an event", ->
        before helpers.cleanDb
        after -> delete @event

        it "When I create an event", (done) ->
            @event =
                description: 'Something to do'
                start: "2013-04-25T15:30:00.000Z"
                end: "2013-04-25T18:30:00.000Z"
                place: "place"
            helpers.createEventFromObject @event, (err, event) =>
                @event.id = event.id
                done()

        it "should return the event with the updated value", (done) ->
            @key = 'ehv629olotwdrito7zxp7qem14iqtmer'
            @event.attendees = []
            @event.attendees.push
                'key': @key
                'status': 'INVITATION-NOT-SENT'
                'email': 'test@cozycloud.cc'

            client.put "events/#{@event.id}", @event, (err, resp, body) =>

                should.not.exist err
                should.exist resp
                resp.should.have.property 'statusCode', 200
                should.exist body

                body.should.have.property 'start'
                body.should.have.property 'end'
                body.should.have.property 'description'
                body.should.have.property 'place'

                body.should.have.property 'attendees'
                body.attendees[0].should.have.property 'key', @key
                body.attendees[0].should.have.property 'status', 'INVITATION-NOT-SENT'
                body.attendees[0].should.have.property 'email', 'test@cozycloud.cc'
                done()

        it "Then guess accepts it", (done) ->
            client.get "public/events/#{@event.id}?key=#{@key}&status=ACCEPTED", (err, resp, body) =>
                err.should.not.exist
                done()

        it "And event should be updated", (done) ->
            client.get "events/#{@event.id}", (err, resp, body) =>

                body.should.have.property 'attendees'
                body.attendees[0].should.have.property 'key', @key
                body.attendees[0].should.have.property 'status', 'ACCEPTED'
                body.attendees[0].should.have.property 'email', 'test@cozycloud.cc'
                done()

        it "Then guess declines it", (done) ->
            client.get "public/events/#{@event.id}?key=#{@key}&status=DECLINED", (err, resp, body) =>
                err.should.not.exist
                done()

        it "And event should be updated", (done) ->
            client.get "events/#{@event.id}", (err, resp, body) =>

                body.should.have.property 'attendees'
                body.attendees[0].should.have.property 'key', @key
                body.attendees[0].should.have.property 'status', 'DECLINED'
                body.attendees[0].should.have.property 'email', 'test@cozycloud.cc'
                done()


    describe "DELETE events/:id", ->

        before helpers.cleanDb
        after -> delete @event

        it "When I create an event", (done) ->
            @event =
                description: 'Something to do'
                start: "2013-04-25T15:30:00.000Z"
                end: "2013-04-25T18:30:00.000Z"
                place: "place"
            helpers.createEventFromObject @event, (err, event) =>
                @event.id = event.id
                done()

        it "should return the deleted event", (done) ->
            client.del "events/#{@event.id}", (err, resp, body) =>
                should.not.exist err
                should.exist resp
                resp.should.have.property 'statusCode', 200

                done()

        it "should have removed the event from the database", (done) ->

            helpers.doesEventExist @event.id, (err, isExist) ->
                should.not.exist err
                should.exist isExist
                isExist.should.be.false
                done()

    describe "POST events/bulk", ->

        before helpers.cleanDb
        after -> delete @events

        it "should return the event json objects", (done) ->
            @events = []

            for i in [1..20]
                @events.push
                    description: "Title #{i}"
                    start: "2013-04-15T15:30:00.000Z"
                    end: "2013-04-15T16:30:00.000Z"
                    place: "place"

            client.post "events/bulk", @events, (error, response, body) =>

                should.not.exist error
                should.exist response
                response.should.have.property 'statusCode', 201
                should.exist body
                should.exist body.events

                body.events.length.should.equal 20

                for event in body.events
                    event.should.have.property 'id'
                    event.should.have.property 'start'
                    event.should.have.property 'end'
                    event.should.have.property 'description'
                    event.should.have.property 'place'

                done()


    describe "GET events/2013/04", ->

        before helpers.cleanDb
        before (done) ->
            events = [
                description: "Title 1"
                start: "2013-04-15T15:30:00.000Z"
                end: "2013-04-15T16:30:00.000Z"
                place: "place"
            ,
                description: "Title 2"
                start: "2011-04-15T15:30:00.000Z"
                end: "2011-04-15T16:30:00.000Z"
                place: "place"
            ,
                description: "Title 3"
                start: "2013-04-16T15:30:00.000Z"
                end: "2013-05-15T16:30:00.000Z"
                place: "place"
            ,
                description: "Title 4"
                start: "2015-05-15T15:30:00.000Z"
                end: "2015-05-15T16:30:00.000Z"
                place: "place"
            ]

            client.post "events/bulk", events, (error, response, body) =>
                done()

        it "should return the event json objects", (done) ->
            client.get "events/2013/04", (err, res, events) =>
                events.length.should.equal 2
                events[0].description.should.equal 'Title 1'
                events[1].description.should.equal 'Title 3'
                done()

