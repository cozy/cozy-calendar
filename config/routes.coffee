exports.routes = (map) ->

    map.get 'reminders', 'reminders#all'
    map.post 'reminders', 'reminders#create'
    map.put 'reminders/:id', 'reminders#update'
