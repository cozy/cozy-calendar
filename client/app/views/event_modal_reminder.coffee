BaseView = require '../lib/base_view'
Toggle = require 'views/toggle'
H = require '../../helpers'

module.exports = class ReminderView extends BaseView

    className: 'reminder'
    template: require('./templates/event_modal_reminder')

    events: -> 
        'click .removereminder': 'remove'

    afterRender: ->
        @actionMail = new Toggle
            icon: 'envelope'
            label: 'email notification'
            value: @model.action in ['EMAIL', 'BOTH']

        @actionNotif = new Toggle
            icon: 'exclamation-sign'
            label: 'home notification'
            value: @model.action in ['DISPLAY', 'BOTH']

        @actionMail.on 'toggle', (mailIsOn) =>
            @actionNotif.toggle true unless mailIsOn

        @actionNotif.on 'toggle', (notifIsOn) =>
            @actionMail.toggle true unless notifIsOn

        inputDuration = @$('.triggervalue')
        inputDuration.before @actionMail.$el
        inputDuration.before @actionNotif.$el


    getRenderData: =>
        if not @model.isNew
            uv = H.iCalDurationToUnitValue @model.trigg
            unit = Object.keys(uv)[0]
            value = uv[unit]
        else
            unit = 'M'
            value = 10

        data = 
            isNew: @model.isNew
            isSelectedUnit: (u) => u is unit
            durationValue: value
            model: @model

        return data

    getModelAttributes: ->
        action = if @actionNotif.value and @actionMail.value then 'BOTH'
        else if @actionMail.value then 'EMAIL'
        else 'DISPLAY'

        uv = {}
        uv[@$('.triggerunit').val()] = @$('.triggervalue').val() 
        data =
            action: action
            trigg: H.unitValuesToiCalDuration uv

        return data
