cozydb = require 'cozydb'

# Object required to store the automatically generated webdav credentials.
module.exports = cozydb.getModel 'WebDAVAccount',
    id: String
    login: String
    token: String
    password: String # old token, kept for retrocompatiblity
    ctag: Number # used to keep track of changes in the calendar
    cardctag: Number # used to keep track of changes in the addressbook
