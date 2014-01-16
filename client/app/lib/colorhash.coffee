module.exports = (tag) ->
    hash = 0
    for i in [0..tag.length-1]
        hash = tag.charCodeAt(i++) + ((hash << 5) - hash)
    colour = '#'
    for i in [0..2]
        colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2)
    return colour