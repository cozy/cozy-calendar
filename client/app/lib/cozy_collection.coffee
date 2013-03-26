class exports.CozyCollection extends Backbone.Collection

    move: (item, newIndex) ->

        oldIndex = @indexOf item
        if oldIndex?
            @models.splice newIndex, 0, @models.splice(oldIndex, 1)[0]
            @trigger "move",
                'item': item
                'oldIndex': oldIndex
                'newIndex': newIndex
        else
            return false


