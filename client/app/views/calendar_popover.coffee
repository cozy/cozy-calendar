BaseView = require '../lib/base_view'

module.exports = class PopOver extends BaseView

    type: undefined
    template: require('./templates/popover_content')

    events:
        'keyup input': 'onKeyUp'
        'click button.add'  : 'onAddClicked'
        'click .remove': 'onRemoveClicked'
        'click .close' : 'close'

    initialize: (options) ->
        @target = options.target
        @container = options.container
        @target.data('popover', null)
        @target.popover(
            title: require('./templates/popover_title')(title: @getTitle())
            html: true
            placement: @getDirection()
            content: @template @getRenderData()
        ).popover('show')
        @$el = $('.container .popover')
        @addButton = @$('button.add').text @getButtonText()
        @addButton.toggleClass 'disabled', @validForm()
        @removeButton = @$('.remove')
        @$('.focused').focus()

    close: ->
        @target.popover 'destroy'
        @target.data('popover', null)
        @remove()

    render: -> # this view cant be rendered

    getTitle: ->
        title = (if @model.isNew() then 'create' else 'edit') + ' ' + @type
        t(title)

    getDirection: ->
        need = @target.position().left + @target.width() + 411 #popover
        if need > @container.width() then 'left'
        else 'right'

    getButtonText: -> if @model.isNew() then t('create') else t('edit')

    onKeyUp: (event) -> #
        if not @validForm()
            @addButton.addClass 'disabled'
        else if event.keyCode is 13 or event.which is 13
            @addButton.click()
        else
            @addButton.removeClass 'disabled'

    formatDate: (relativeTo, value) ->
        # Intitialize new alarm
        date = Date.create relativeTo

        # smart detection: set the time if the user input has a time
        splitted = value.match /([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/
        if splitted and splitted[0]
            [all, hours, minutes, diff] = splitted
            date.set {hours: +hours, minutes: +minutes}
            date.advance(days: +diff) if diff

        return date

    onRemoveClicked: =>
        @removeButton.css 'width', '42px'
        @removeButton.spin 'tiny'
        if confirm 'Are you sure ?'
            @model.destroy
                wait: true
                error: ->
                    alert 'server error occured'
                complete: =>
                    @removeButton.spin()
                    @removeButton.css 'width', '14px'
                    @close()

    onAddClicked: () =>
        @addButton.html '&nbsp;'
        @addButton.spin 'small'
        @model.save @getModelAttributes(),
            wait: true
            success: =>
                collection = app[@type+'s']
                collection.add @model
            error: =>
                alert 'server error occured'
            complete: =>
                @addButton.spin()
                @addButton.html @getButtonText()
                @close()
