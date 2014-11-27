Contact = require '../models/contact'

module.exports = class ContactCollection extends Backbone.Collection

    model: Contact
    url: 'contacts'

    asTypeaheadSource: (query) ->
        regexp = new RegExp query
        contacts = @filter (contact) -> contact.match regexp
        items = []
        contacts.forEach (contact) ->
            contact.get('emails').forEach (email) ->
                items.push
                    id: contact.id
                    display: "#{contact.get 'name'} &lt;#{email.value}&gt;"
                    toString: -> "#{email.value};#{contact.id}"

        return items



