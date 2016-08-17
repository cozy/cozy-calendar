# A simple client to be able to send request directly to the data-system.

request = require 'request-json'


# The data-system port is configurable.
DS_PORT = process.env.DS_PORT or 9101
client  = request.createClient "http://localhost:#{DS_PORT}"

if process.env.NODE_ENV in ["production", "test"]
    client.setBasicAuth process.env.NAME, process.env.TOKEN
else
    client.setBasicAuth Math.random().toString(36), "token"


module.exports = client

