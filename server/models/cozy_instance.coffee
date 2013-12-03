americano = require 'americano-cozy'

module.exports = CozyInstance = americano.getModel 'CozyInstance',
    id:     type: String
    domain: type: String
    locale: type: String

CozyInstance.first = (callback) ->
    CozyInstance.request 'all', (err, instances) ->
        if err then callback err
        else if not instances or instances.length is 0 then callback null, null
        else  callback null, instances[0]

CozyInstance.getURL = (callback) ->
    CozyInstance.first (err, instance) ->
        if instance?.domain
            callback null, instance.domain
        else
            callback err or new Error('no instance domain')

CozyInstance.getLocale = (callback) ->
    CozyInstance.first (err, instance) ->
        callback err, instance?.locale or 'en'
