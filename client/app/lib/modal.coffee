class Modal extends Backbone.View

    id:'modal-dialog'
    className:'modal fade'
    attributes:
        'data-backdrop':"static" #prevent bs closing by backdrop
        'data-keyboard':"false"  #prevent bs closing by esc

    initialize: (options) ->
        @title ?= options.title
        @content ?= options.content
        @yes ?= options.yes or 'ok'
        @no ?= options.no or 'cancel'
        @cb ?= options.cb or ->
        @render()
        @saving = false
        @$el.modal 'show'

        # cut default bootstrap behaviour. Done here rather than in
        # delegateEvents to be run before bootstrap callback.
        @$('button.close').click (event) =>
            event.stopPropagation()
            @onNo()

        $(document).on 'keyup', @closeOnEscape

    events: ->
        "click #modal-dialog-no"  : 'onNo'
        "click #modal-dialog-yes" : 'onYes'
        'click'                   : 'onClickAnywhere'

    onNo: ->
        return if @closing
        @closing = true
        @$el.modal 'hide'
        setTimeout (=> @remove()), 500
        @cb false

    onYes: ->
        return if @closing
        @closing = true
        @$el.modal 'hide'
        setTimeout (=> @remove()), 500
        @cb true

    closeOnEscape: (e) =>
        @onNo() if e.which is 27

    remove: ->
        $(document).off 'keyup', @closeOnEscape
        super

    render: ->
        close = $('<button class="close" type="button" data-dismiss="modal" aria-hidden="true">×</button>')
        title = $('<h4 class="model-title">').text @title
        head  = $('<div class="modal-header">').append close, title
        body  = $('<div class="modal-body">').append @renderContent()
        yesBtn= $('<button id="modal-dialog-yes" class="btn btn-cozy">').text @yes
        foot  = $('<div class="modal-footer">').append yesBtn
        foot.prepend $('<button id="modal-dialog-no" class="btn btn-link">').text(@no) if @no

        container = $('<div class="modal-content">').append head, body, foot
        container = $('<div class="modal-dialog">').append container
        $("body").append @$el.append container

    renderContent: -> @content

    # if the target is not a child element, the click targets the backdrop
    onClickAnywhere: (event) -> @onNo() if event.target.id is @id

Modal.alert = (title, content, cb) ->
    new Modal {title, content, yes: 'ok', no: null, cb}

Modal.confirm = (title, content, yesMsg, noMsg, cb) ->
    new Modal {title, content, yes: yesMsg, no:noMsg, cb}

Modal.error = (text, cb) ->
    new Modal
        title: t 'modal error'
        content: text
        yes: t 'modal ok'
        no: false
        cb: cb

module.exports = Modal