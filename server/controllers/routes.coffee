{SimpleController} = require 'cozydb'
tags = require './tags'
events = require './events'
index  = require './index'
ical   = require './ical'
ContactsController = new SimpleController
    model: require('../models/contact')
    reqProp: 'contact'
    reqParamID: 'contactid'


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
        delete: events.bulkDelete

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
        get: ContactsController.listAll

    'contacts/:contactid.jpg':
        get: ContactsController.sendAttachment(filename: 'picture')

    # log client errors
    'log':
        post: index.logClient

