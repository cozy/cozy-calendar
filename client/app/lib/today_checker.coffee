# For people that let their computer / browser run during the night
# the 'today' is not properly set anymore the day after.
module.exports = (router) ->

    # Define `waitToChangeToday`, and run it.
    do waitToChangeToday = =>

        now = moment()
        nextDay = moment(now).add(1, 'days').startOf 'day'
        nextTick = nextDay.valueOf() - now.valueOf()

        setTimeout ->
            # Completely re-render fullCalendar if it's open.
            # fullCalendar doesn't allow to change the 'today' date manually.
            view = router.mainView
            if view.cal?
                view.cal.fullCalendar 'destroy'
                view.afterRender()

            # Restart the timer for the next day.
            waitToChangeToday()

        , nextTick
