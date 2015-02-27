var jade = require('jade/runtime');
module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (event, date, visitor, key, file) {
buf.push("<!DOCTYPE html><html><head><title>Cozy - Calendar</title><meta charset=\"utf-8\"><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><script src=\"javascripts/modernizr-2.6.1.js\"></script><link rel=\"stylesheet\" href=\"../stylesheets/app.css\"></head><body class=\"public\"><div id=\"container\" class=\"container public-event-container well\"><h4>Would you be there?</h4><h2>" + (jade.escape((jade_interp = event.description) == null ? '' : jade_interp)) + "");
if ( event.place != null && event.place.length != 0)
{
buf.push("&nbsp;(" + (jade.escape((jade_interp = event.place) == null ? '' : jade_interp)) + ")");
}
buf.push("</h2><h3>On " + (jade.escape((jade_interp = date) == null ? '' : jade_interp)) + "</h3>");
if ( visitor.status == 'NEEDS-ACTION')
{
buf.push("<p><a" + (jade.attr("href", "?status=ACCEPTED&key=" + key, true, true)) + " class=\"btn\">Yes</a></p><p><a" + (jade.attr("href", "?status=DECLINED&key=" + key, true, true)) + " class=\"btn\">No</a></p>");
}
else if ( visitor.status == 'ACCEPTED')
{
buf.push("<p>You declared you will participage to this event.</p><p><a" + (jade.attr("href", "" + (event.id) + "/" + (file) + ".ics?key=" + key, true, true)) + ">Download this event</a></p><p><a" + (jade.attr("href", "?status=DECLINED&key=" + key, true, true)) + " class=\"btn\">Decline the invitation</a></p>");
}
else
{
buf.push("<p>You declared you won't participate to this event.</p><p><a" + (jade.attr("href", "?status=ACCEPTED&key=" + key, true, true)) + " class=\"btn\">Accept the invitation</a></p>");
}
buf.push("</div></body></html>");}.call(this,"event" in locals_for_with?locals_for_with.event:typeof event!=="undefined"?event:undefined,"date" in locals_for_with?locals_for_with.date:typeof date!=="undefined"?date:undefined,"visitor" in locals_for_with?locals_for_with.visitor:typeof visitor!=="undefined"?visitor:undefined,"key" in locals_for_with?locals_for_with.key:typeof key!=="undefined"?key:undefined,"file" in locals_for_with?locals_for_with.file:typeof file!=="undefined"?file:undefined));;return buf.join("");
}