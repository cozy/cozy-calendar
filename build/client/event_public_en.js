var jade = require('jade/runtime');
module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (event, date, visitor, key, file) {
buf.push("<!DOCTYPE html><html><head><title>Cozy Calendar - Upcoming Event</title><meta charset=\"utf-8\"><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><script src=\"javascripts/modernizr-2.6.1.js\"></script><link rel=\"stylesheet\" href=\"/fonts/fonts.css\"><link rel=\"stylesheet\" href=\"../stylesheets/app.css\"></head><body class=\"public public-event-body\"><header><img src=\"https://docs.cozy.io/assets/images/cozy-logo.png\"></header><main id=\"container\" class=\"container public-event-container well\"><h2>" + (jade.escape((jade_interp = event.description) == null ? '' : jade_interp)) + "</h2><h3>On " + (jade.escape((jade_interp = date) == null ? '' : jade_interp)) + "");
if ( event.place != null && event.place.length != 0)
{
buf.push("&nbsp; at (" + (jade.escape((jade_interp = event.place) == null ? '' : jade_interp)) + ")");
}
buf.push("</h3>");
if ( visitor.status == 'NEEDS-ACTION')
{
buf.push("<p><a" + (jade.attr("href", "?status=ACCEPTED&key=" + key, true, true)) + " class=\"btn\">Going</a></p><p><a" + (jade.attr("href", "?status=DECLINED&key=" + key, true, true)) + " class=\"btn btn-negative\">Decline</a></p>");
}
else if ( visitor.status == 'ACCEPTED')
{
buf.push("<p>You are attending this event.</p><p><a" + (jade.attr("href", "" + (event.id) + "/" + (file) + ".ics?key=" + key, true, true)) + ">Download event</a></p><hr><p class=\"special\">Changed your mind ?</p><a" + (jade.attr("href", "?status=DECLINED&key=" + key, true, true)) + " class=\"btn btn-negative\">Decline</a>");
}
else
{
buf.push("<p>You are not attending this event.</p><hr><p class=\"special\">Changed your mind ?</p><a" + (jade.attr("href", "?status=ACCEPTED&key=" + key, true, true)) + " class=\"btn\">Going</a>");
}
buf.push("</main></body></html>");}.call(this,"event" in locals_for_with?locals_for_with.event:typeof event!=="undefined"?event:undefined,"date" in locals_for_with?locals_for_with.date:typeof date!=="undefined"?date:undefined,"visitor" in locals_for_with?locals_for_with.visitor:typeof visitor!=="undefined"?visitor:undefined,"key" in locals_for_with?locals_for_with.key:typeof key!=="undefined"?key:undefined,"file" in locals_for_with?locals_for_with.file:typeof file!=="undefined"?file:undefined));;return buf.join("");
}