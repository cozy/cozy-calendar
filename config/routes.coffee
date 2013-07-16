exports.routes = (map) ->

    map.get 'alarms', 'alarms#all'
    map.post 'alarms', 'alarms#create'
    map.put 'alarms/:id', 'alarms#update'
    map.delete 'alarms/:id', 'alarms#delete'
    map.get 'alarms/:id', 'alarms#getOne'

    map.get 'ical.ics', 'ical#ics'
    map.get 'public/ical.ics', 'ical#ics'
