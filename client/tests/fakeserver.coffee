createSinonServer = ->
    @server = server = sinon.fakeServer.create()

    # DRY JSON management
    # - method : the HTTP verb we are responding to
    # - url : the url we are responding to
    # - code : the HTTP status code to reply with
    # - JSONResponder : a (req, body) -> reply's body function
    createAutoResponse = (method, url, code, JSONResponder) ->
        server.respondWith method, url, (req) ->
            body = JSON.parse req.requestBody
            res = JSONResponder req, body
            headers = 'Content-Type': 'application/json'
            req.respond code, headers, JSON.stringify res

    # utility function to check in tests that the requests are as expected
    @server.checkLastRequestIs = (method, url) ->
        req = server.requests[server.requests.length - 1]
        expect(req.url).to.equal url
        expect(req.method).to.equal method

    # begin actual fake server

    return @server