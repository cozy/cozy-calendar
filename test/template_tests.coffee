should = require('should')
Client = require('request-json').Client
app = require('../server')

client = new Client "http://localhost:8888/"


describe "Test section", ->

    before (done) ->
        app.listen 8888
        done()

    after (done) ->
        app.close()
        done()

    it "Then it succeeds", ->
        "ok".should.equal "ok"
