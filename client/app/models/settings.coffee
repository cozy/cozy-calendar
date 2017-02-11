module.exports = class Settings extends Backbone.Model

    urlRoot: 'settings'

    # Make sure that put requests doesn't add id to the url.
    sync: (method, model, options) ->
      options.url = 'settings'
      return Backbone.sync method, model, options
