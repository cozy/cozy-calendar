tags = require './tags'
events = require './events'
index  = require './index'
ical   = require './ical'
contacts = require './contacts'
sharings = require './sharings'

module.exports =

    '':
        get: index.index

    # Tag management
    'tags':
        get: tags.all
        post: tags.create
    'tagid':
        param: tags.fetch
    'tags/:tagid':
        get: tags.read
        put: tags.update
        delete : tags.delete


    # Event management
    'eventid':
        param: events.fetch
    'events':
        get: events.all
        post: events.create
    'events/bulk':
        post: events.createBulk
    'events/:year/:month':
        get: events.monthEvents

    'events/rename-calendar':
        post: events.bulkCalendarRename
    'events/delete':
        post: events.bulkDelete

    'events/:eventid':
        get: events.read
        put: events.update
        delete: events.delete

    'events/:eventid/:name.ics':
        get: events.ical
    'public/events/:eventid/:name.ics':
        get: events.publicIcal
    'public/events/:publiceventid':
        get: events.public

    # ICal
    'export/:calendarid.ics':
        get   : ical.export
    'exportzip/:ids':
        get   : ical.zipExport
    'import/ical':
        post  : ical.import
    #'public/calendars/:calendarname.ics':
        #get   : ical.calendar

    # Contacts
    'contacts':
        get: contacts.listAll

    'contacts/:contactid.jpg':
        get: contacts.sendAttachment(filename: 'picture')

    'contacts/:contactid':
        get: [contacts.find, contacts.sendSmall]

    # log client errors
    'log':
        post: index.logClient

    # Sharing
    'sharingid':
        param: sharings.fetch

    'sharings':
        get: sharings.all

    'sharings/:sharingid':
        get: sharings.read

    'sharing/accept':
        post: sharings.accept

    'sharing/refuse':
        post: sharings.refuse
