exports.routes = (map) ->

    map.get 'reminders', 'reminders#all'
    map.post 'reminders', 'reminders#create'
    map.del 'reminders/:id', 'reminders#destroy'
