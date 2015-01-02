americano = require 'americano-cozy'

# Object required to store the automatically generated webdav credentials.
module.exports = WebDAVAccount = americano.getModel 'WebDAVAccount',
    id: String
    login: String
    token: String
    password: String # old token, kept for retrocompatiblity
    ctag: Number # used to keep track of changes in the calendar
    cardctag: Number # used to keep track of changes in the addressbook

WebDAVAccount.first = (callback) ->
    WebDAVAccount.request 'all', (err, accounts) ->
        if err then callback err
        else if not accounts or accounts.length is 0 then callback null, null
        else callback null, accounts[0]
