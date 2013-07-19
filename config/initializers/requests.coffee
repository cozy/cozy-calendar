module.exports = (compound) ->

    Event = compound.models.Event
    Alarm = compound.models.Alarm
    User = compound.models.User

    all = (doc) ->
        emit doc.title, doc

    Alarm.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request Alarm#All, cannot be created"
            compound.logger.write err

    Event.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request Event#All, cannot be created"
            compound.logger.write err 

    User.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request User#All, cannot be created"
            compound.logger.write err

    byDateAlarm = (doc) ->
        emit new Date(doc.trigg), doc

    Alarm.defineRequest "byDate", byDateAlarm, (err) ->
        if err
            compound.logger.write "Request Alarm#byDate, cannot be created"
            compound.logger.write err

    byDateEvent = (doc) ->
        emit new Date(doc.start), doc
        
    Event.defineRequest "byDate", byDateEvent, (err) ->
        if err
            compound.logger.write "Request Event#byDate, cannot be created"
            compound.logger.write err 

