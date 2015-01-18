cozydb = require 'cozydb'

module.exports = CozyInstance = cozydb.getModel 'CozyInstance',
    id:     type: String
    domain: type: String
    locale: type: String

CozyInstance.getURL = (callback) ->
    CozyInstance.first (err, instance) ->
        if instance?.domain
            callback null, instance.domain
        else
            callback err or new Error('no instance domain')

CozyInstance.getLocale = (callback) ->
    CozyInstance.first (err, instance) ->
        callback err, instance?.locale or 'en'
