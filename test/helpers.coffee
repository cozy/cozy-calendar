Client = require('request-json').JsonClient
client = new Client "http://localhost:8888/"
ds = new Client "http://localhost:9101/"
ds.setBasicAuth process.env.NAME, process.env.TOKEN

module.exports = helpers = {}

if process.env.USE_JS
    helpers.prefix = '../build/'
else
    helpers.prefix = '../'

Event = require "#{helpers.prefix}server/models/event"
User  = require "#{helpers.prefix}server/models/user"

userID = null

helpers.before = (done) ->
    @timeout 10000
    start = require "#{helpers.prefix}server"
    start 8888, (err, app, server) =>
        @server = server
        data =
            docType: 'User'
            email: 'test@cozycloud.cc'
            password: 'password'
            timezone: 'Europe/Paris'
        ds.post '/data/', data, (err, response, body) ->
            return done err if err
            userID = body._id
            # wait a little for User.timezone to be updated through Realtime
            setTimeout done, 1000

helpers.after = (done) ->
    @server.close()
    helpers.cleanDb ->
        ds.del "/data/#{userID}/", done

# Remove all the alarms
helpers.cleanDb = (callback) ->
    Event.destroyAll callback

# Get all the alarams
helpers.getAllEvents = (callback) ->
    Event.all callback

# Create an event from values
helpers.createEvent = (start, end, place, description, callback) ->
    (callback) ->
        evt =
            start: start
            end: end
            place: place
            description: description
            tags: ['my calendar']

        Event.create evt, callback

# Create an alarm from object
helpers.createEventFromObject = (data, callback) ->
    Event.create data, callback

helpers.getEventByID = (id, callback) ->
    Event.find id, callback

helpers.doesEventExist = (id, callback) ->
    Event.exists id, callback
