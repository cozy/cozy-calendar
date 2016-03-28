cozydb = require 'cozydb'

module.exports = Contact = cozydb.getModel 'Contact',
    fn            : String
    n             : String
    datapoints    : [Object]
    revision      : String
    note          : String
    tags          : [String]
    revision      : String
    accounts      : String
    title         : String
    org           : String
    bday          : String
    url           : String
    initials      : String
    sortedName    : String
    ref           : String


Contact::asNameAndEmails = ->
    name = @fn or @n?.split(';')[0..1].join ' '
    emails = @datapoints?.filter (dp) -> dp.name is 'email'
    return simple =
        id: @id
        name: name or '?'
        emails: emails or []
        hasPicture: @_attachments?.picture?
