should = require('should')
async = require('async')
Client = require('request-json').JsonClient
instantiateApp = require('../server')
app = instantiateApp()

client = new Client "http://localhost:8888/"

testLength = (body, length) ->
    should.exist body
    should.exist body.rows
    body.rows.length.should.equal length

describe "GET /reminders", ->

    before (done) ->
        helpers = require("./helpers")(app.compound)
        initDb = (callback) ->

            async.series [
                helpers.createReminder "Something to remind"
                helpers.createReminder "Something to remind else"
            ], ->
                callback()
        app.listen 8888
        helpers.cleanDb ->
            initDb done

    after (done) ->
        app.compound.server.close()
        done()

    it "Retrieves all the reminders", (done) ->

        client.get "reminders/", (error, response, body) =>

            response.statusCode.should.equal 200
            body.length.should.equal 2
            done()
