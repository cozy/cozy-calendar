module.exports = class Tags extends Backbone.Collection

    url: 'tags'
    parse: (raw) ->
        out = []
        out.push type:'calendar', label:tag for tag in raw.calendars
        out.push type:'tag',      label:tag for tag in raw.tags
        return out

    model: class Tag extends Backbone.Model
        defaults: visible: true
        toString: -> @get 'label'

    stringify = (tag) -> tag.toString()

    toArray: -> @map stringify
    calendars: -> @find(type:'calendar')