Client = require('request-json').JsonClient

client = new Client "http://localhost:8888/"
helpers = require './helpers'
should = require 'should'

describe "Index Page", ->

    before helpers.before
    after helpers.after

    describe "GET /", ->

        before helpers.cleanDb
        before helpers.createEvent "2013-04-23T14:40:00.000Z",
                    "2013-04-23T15:40:00.000Z", "Place", 3,
                    "Something to do"
        before helpers.createEvent "2013-04-24T13:30:00.000Z",
                    "2013-04-24T14:00:00.000Z", "Other place", 0,
                    "Something else to do"

        after helpers.cleanDb

        it "should return a 200", (done) ->
            client.get "", (error, response, body) ->

                should.not.exist error
                should.exist response
                should.exist body

                response.should.have.property 'statusCode', 200
                done()

            , false #response is HTML, dont parse it