module.exports = (compound) ->
    #requests = require "../../common/requests"

    VTodo = compound.models.VTodo

    all = (doc) ->
        emit doc.title, doc

    VTodo.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Request VTodo#All, cannot be created"
            compound.logger.write err