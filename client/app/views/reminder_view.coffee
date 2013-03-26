View = require '../lib/view'

module.exports = class ReminderView extends View

    tagName: 'div'
    className: 'reminder'

    events:
        "click button.delete": "onDeleteButtonClicked"

    render: ->
        super
            title: @model.get 'title'
            url: @model.get 'url'

    template: ->
        require('./templates/reminder')

    onDeleteButtonClicked: =>
        @model.destroy
            wait: true
            error: ->
              alert "Server error occured, reminder was not deleted."


