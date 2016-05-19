EventPopoverScreenView = require 'views/event_popover_screen'
helpers = require 'helpers'

module.exports = class AlertPopoverScreen extends EventPopoverScreenView

    # Define the available options to create alerts.
    # Key is the unit M: minute, H: hour, D: day, and W: week
    # Value is the number of units.
    @ALERT_OPTIONS: [
        {M: 0}
        {M: 15}
        {M: 30}
        {H: 1}
        {H: 2}
        {H: 6}
        {H: 12}
        {D: 1}
        {D: 2}
        {D: 3}
        {D: 5}
        {W: 1}
    ]

    screenTitle: t('screen alert title empty')
    templateContent: require 'views/templates/popover_screens/alert'

    templateAlertRow: require 'views/templates/popover_screens/alert_row'

    events:
        'change .new-alert': 'onNewAlert'
        'click .alerts li .alert-delete': 'onRemoveAlert'
        'click input[type="checkbox"]': 'onChangeActionAlert'


    getRenderData: ->

        # Override the screen title based on the model's value.
        alerts = @formModel.get('alarms') or []
        numAlerts = alerts.length
        if numAlerts > 0
            @screenTitle = t('screen alert title', smart_count: numAlerts)
        else
            @screenTitle = t('screen alert title empty')

        # Get a formatted list based on defined options.
        alertOptions = AlertPopoverScreen.ALERT_OPTIONS
        formattedAlertOptions = alertOptions.map (alert, index) =>
            translationInfo = @getAlertTranslationInfo alert
            return _.extend {}, translationInfo, {index}

        return _.extend super(),
            alertOptions: formattedAlertOptions
            alerts: @formModel.get('alarms')


    afterRender: ->
        $alerts = @$ '.alerts'

        # Remove the existing elements of the list.
        $alerts.empty()

        # Create a list item for each alert.
        alarms = @formModel.get('alarms') or []
        for alarm, index in alarms
            trigger = helpers.iCalDurationToUnitValue alarm.trigg
            {translationKey, value} = @getAlertTranslationInfo trigger
            options =
                index: index
                label: t(translationKey, smart_count: value)
                action: alarm.action
                isEmailChecked: alarm.action in ['EMAIL', 'BOTH']
                isNotifChecked: alarm.action in ['DISPLAY', 'BOTH']

            row = @templateAlertRow options
            $alerts.append row


    # Handle alert removal.
    onRemoveAlert: (event) ->

        # Get which alert to remove.
        index = @$(event.target).parents('li').attr 'data-index'

        # Remove the alert.
        alerts = @formModel.get('alarms') or []
        alerts.splice index, 1
        @formModel.set 'alarms', alerts

        # Inefficient way to refresh the list, but it's okay since it will never
        # be a big list.
        @render()


    # Handle alert action toggle.
    onChangeActionAlert: (event) ->
        checkbox = @$ event.target

        # Get action to toggle.
        isEmailAction = checkbox.hasClass 'action-email'
        action = if isEmailAction then 'EMAIL' else 'DISPLAY'
        otherAction = if action is 'EMAIL' then 'DISPLAY' else 'EMAIL'

        # Get alert index.
        index = checkbox.parents('li').attr 'data-index'

        # Get current action.
        alerts = @formModel.get 'alarms'
        currentAction = alerts[index].action

        # If two actions are selected, unselect this one.
        if currentAction is 'BOTH'
            newAction = otherAction

        # If the other action is selected, select this one (both are selected).
        else if currentAction is otherAction
            newAction = 'BOTH'

        # Otherwise do nothing, there must be at least one action selected.
        else
            event.preventDefault()

        # Update the alert only if it has changed.
        if newAction?
            alerts[index].action = newAction
            @formModel.set 'alarms', alerts


    # Handle new alert.
    onNewAlert: ->
        index = parseInt @$('select.new-alert').val()

        # -1 is the default placeholder, it's not bound to any real value.
        if index isnt -1

            # Get the ical-formatted value: relative time.
            alertOption = AlertPopoverScreen.ALERT_OPTIONS[index]
            triggerValue = helpers.unitValuesToiCalDuration alertOption

            # Add it to the list of alarms.
            alarms = @formModel.get('alarms') or []
            alarms.push
                action: 'DISPLAY'
                trigg: triggerValue

            @formModel.set 'alarms', alarms

            # Reset selected value
            @$('select.new-alert').val(-1)

            # Inefficient way to refresh the list, but it's okay since it will
            # never be a big list.
            @render()


    # Extract translation information based of an ALERT_OPTIONS item.
    getAlertTranslationInfo: (alert) ->
        [unit] = Object.keys(alert)
        translationKey = switch unit
            when 'M' then 'screen alert minute'
            when 'H' then 'screen alert hour'
            when 'D' then 'screen alert day'
            when 'W' then 'screen alert week'

        value = parseInt(alert[unit])

        if unit is 'M' and value is 0
            translationKey = 'screen alert time of event'

        return {translationKey, value}
