module.exports = class Contact extends Backbone.Model

    urlRoot: 'contacts'

    match: (filter) ->
        filter.test(@get('name')) or
        @get('emails').some (dp) ->
            filter.test dp.get('value')