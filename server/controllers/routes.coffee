tags = require './tags'
events = require './events'
contacts = require './contacts'
index  = require './index'
ical   = require './ical'

module.exports =

    '' : get : index.index
    'users/current': get : index.userTimezone

    # Tag management
    'tags': 
        get : tags.all
        post : tags.create
    'tagid':
        param : tags.fetch
    'tags/:tagid':
        get : tags.read
        put : tags.update
        del : tags.delete


    # Event management
    'events':
        get   : events.all
        post  : events.create
    'eventid':
        param : events.fetch

    'events/rename-calendar':
        post: events.bulkCalendarRename
    'events/delete':
        del: events.bulkDelete

    'events/:eventid':
        get   : events.read
        put   : events.update
        del   : events.delete

    'events/:eventid/:name.ics':
        get   : events.ical
    'public/events/:eventid/:name.ics':
        get   : events.publicIcal
    'public/events/:eventid':
        get   : events.public

    # ICal
    'export/:calendarid.ics':
        get   : ical.export
    'import/ical':
        post  : ical.import
    #'public/calendars/:calendarname.ics':
        #get   : ical.calendar

    # Contacts
    'contacts':
        get: contacts.list
