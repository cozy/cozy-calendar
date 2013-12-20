americano = require 'americano-cozy'

module.exports = Contact = americano.getModel 'Contact',
    fn            : String
    n             : String
    datapoints    : [Object]


Contact::asNameAndEmails = ->
    name = @fn or @n?.split(';')[0..1].join(' ')
    emails = @datapoints?.filter (dp) -> dp.name is 'email'
    return simple =
        id: @id
        name: name or '?'
        emails: emails or []
