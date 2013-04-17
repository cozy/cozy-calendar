exports.routes = (map) ->

    map.get 'alarms', 'alarms#all'
    map.post 'alarms', 'alarms#create'
    map.put 'alarms/:id', 'alarms#update'
    map.delete 'alarms/:id', 'alarms#delete'
    map.get 'alarms/:id', 'alarms#getOne'
