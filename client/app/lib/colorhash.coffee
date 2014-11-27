hue2rgb = (p,q,t) ->
    if t < 0 then t += 1
    if t > 1 then t -= 1
    if t < 1/6 then return p + (q - p) * 6 * t
    if t < 1/2 then return q
    if t < 2/3 then return p + (q - p) * (2/3 - t) * 6
    return p

hslToRgb = (h, s, l) ->
    if s is 0 then r = g = b = l
    else
        q = if l < 0.5 then l * (1 + s) else l + s - l * s
        p = 2 * l - q
        r = hue2rgb p, q, h + 1/3
        g = hue2rgb p, q, h
        b = hue2rgb p, q, h - 1/3

    color = ((1 << 24) + (r*255 << 16) + (g*255 << 8) + parseInt(b*255))
    return "##{color.toString(16).slice 1}"

module.exports = (tag) ->
    if tag isnt "my calendar"
        hash = 0
        for i in [0..tag.length-1]
            hash = (tag.charCodeAt(i) + (hash << 5) - hash)

        h = (hash% 100)/100
        s = (hash% 1000)/1000
        l = 0.5 + 0.2*(hash% 2)/ 2
        colour = hslToRgb h, s, l
        return colour
    else
        return '#008AF6'
