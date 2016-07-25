{SimpleController} = require 'cozydb'
ContactsController = new SimpleController
    model: require('../models/contact')
    reqProp: 'contact'
    reqParamID: 'contactid'

ContactsController.sendSmall = (req, res) ->
    res.send req.contact.asNameAndEmails()

module.exports = ContactsController
