jade = require 'jade'
fs = require 'fs'
Polyglot = require 'node-polyglot'
Instance = require '../models/cozy_instance'

# Seeks the proper locale files, depending if we run from build/ or from sources
path = require 'path'
LOCALE_PATH = path.resolve __dirname, '../../client/app/locales/'

class LocalizationManager

    polyglot: null
    templateCache: {}

    # should be run when app starts
    initialize: (callback = () ->) ->
        @retrieveLocale (err, locale) =>
            if err?
                @polyglot = @getPolyglotByLocale null
            else
                @polyglot = @getPolyglotByLocale locale
                @prepareEmailsTemplate()
            callback null, @polyglot

    retrieveLocale: (callback) ->
        Instance.getLocale (err, locale) ->
            if err? or not locale then locale = 'en' # default value
            callback err, locale

    getPolyglotByLocale: (locale) ->
        try
            phrases = require "#{LOCALE_PATH}/#{locale}"
        catch err
            phrases = require "#{LOCALE_PATH}/en"
        return new Polyglot {locale, phrases}

    prepareEmailsTemplate: ->
        locale = @getLocale()
        for name in ['mail_invitation', 'mail_update', 'mail_delete']
            cacheKey = "#{name}_#{locale}"
            @templateCache[cacheKey] = @buildEmailTemplate name

    # execute polyglot.t, for server-side localization
    t: (key, params = {}) -> return @polyglot?.t key, params

    buildEmailTemplate: (name) ->
        filePath = "../mails/#{@polyglot.currentLocale}/#{name}.jade"
        templatefile = require('path').join __dirname, filePath
        return jade.compile fs.readFileSync templatefile, 'utf8'

    getEmailTemplate: (name) ->
        cacheKey = "#{name}_#{@getLocale()}"
        # builds the template if it doesn't exist
        unless @templateCache[cacheKey]?
            @templateCache[cacheKey] = @buildEmailTemplate name

        return @templateCache[cacheKey]

    getLocale: -> return @polyglot.currentLocale

    # for template localization
    getPolyglot: -> return @polyglot

module.exports = new LocalizationManager()
