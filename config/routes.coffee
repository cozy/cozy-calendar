exports.routes = (map) ->

    map.get '/', 'alarms#index'

    # Alarm management
    map.get 'alarms', 'alarms#all'
    map.post 'alarms', 'alarms#create'
    map.put 'alarms/:id', 'alarms#update'
    map.delete 'alarms/:id', 'alarms#delete'
    map.get 'alarms/:id', 'alarms#getOne'

    # Event management
    map.get 'events', 'events#all'
    map.post 'events', 'events#create'
    map.put 'events/:id', 'events#update'
    map.delete 'events/:id', 'events#delete'
    map.get 'events/:id', 'events#getOne'

    # Ical support
    map.get 'export/calendar.ics', 'ical#export'
    map.post 'import/ical', 'ical#import'
