PopoverScreenView = require 'lib/popover_screen_view'

tFormat                 = 'HH:mm'
dFormat                 = 'DD/MM/YYYY'
inputDateDTPickerFormat = 'dd/mm/yyyy'
allDayDateFieldFormat   = 'YYYY-MM-DD'

module.exports = class RepeatPopoverScreen extends PopoverScreenView

    screenTitle: 'Repeat'
    templateContent: require 'views/templates/popover_screens/repeat'

    events:
        'change .input-repeat': 'onSelectRepeat'


    getRenderData: ->

        # A new event's calendar is the first calendar in alphabetical order
        # It fallbacks to the default calendar name if anything goes wrong
        firstCalendar = app.calendars?.at(0)?.get 'name'
        defaultCalendar = t 'default calendar name'
        if @model.isNew()
            currentCalendar = firstCalendar or defaultCalendar
        else
            currentCalendar = @model.get('tags')?[0] or defaultCalendar

        return data = _.extend {}, @model.toJSON(),
            tFormat:     tFormat
            dFormat:     dFormat
            editionMode: not @model.isNew()
            calendar:    currentCalendar
            allDay:      @model.isAllDay()
            sameDay:     @model.isSameDay()
            start:       @model.getStartDateObject()
            end:         @model.getEndDateObject()
                               .add((if @model.isAllDay() then -1 else 0), 'd')


    onSelectRepeat: ->
        value = parseInt @$('select.input-repeat').val()

        # -1 is the default placeholder, it's not bound to any real value.
        if value isnt -1

            # Reset the specific fields' visibility.
            @$('[aria-hidden="false"]:not(.generic)').attr 'aria-hidden', true

            # Turn repeat type into a selector.
            repeatTypeSelector = switch value
                when 0 then '.daily-only'
                when 1 then '.weekly-only'
                when 2 then '.monthly-only'
                when 3 then '.yearly-only'

            # Show fields based on repeat type.
            @$('[aria-hidden="true"].generic').attr 'aria-hidden', false
            @$(repeatTypeSelector).attr 'aria-hidden', false

        # Hide all the fields if 'no repeat' is selected.
        else
            @$('[aria-hidden="false"]').attr 'aria-hidden', true

