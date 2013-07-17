exports.routes = (map) ->

	# Alarm management
    map.get 'alarms', 'alarms#all'
    map.post 'alarms', 'alarms#create'
    map.put 'alarms/:id', 'alarms#update'
    map.delete 'alarms/:id', 'alarms#delete'
    map.get 'alarms/:id', 'alarms#getOne'

    map.get 'ical.ics', 'ical#ics'
    map.get 'public/ical.ics', 'ical#ics'

 	# Event management
    map.get 'events', 'events#all'
    map.post 'events', 'events#create'
    map.put 'events/:id', 'events#update'
    map.delete 'events/:id', 'events#delete'
    map.get 'events/:id', 'events#getOne' 