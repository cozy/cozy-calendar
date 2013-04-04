module.exports = (compound, VTodo) ->

    VTodo.all = (params, callback) ->
        VTodo.request "all", params, callback