alarms = require './alarms'
events = require './events'
contacts = require './contacts'
index  = require './index'
ical   = require './ical'


module.exports =

    '' : get : index.index

    # Alarm management
    'alarms':
        get   : alarms.all
        post  : alarms.create
    'alarmid':
        param : alarms.fetch
    'alarms/:alarmid':
        get   : alarms.read
        put   : alarms.update
        del   : alarms.delete

    # Event management
    'events':
        get   : events.all
        post  : events.create
    'eventid':
        param : events.fetch
    'events/:eventid':
        get   : events.read
        put   : events.update
        del   : events.delete

    'public/event:eventid.ics':
        get   : events.publicIcal
    'public/event:eventid':
        get   : events.public

    # ICal
    'export/calendar.ics':
        get   : ical.export
    'import/ical':
        post  : ical.import

    # Contacts
    'contacts':
        get: contacts.list