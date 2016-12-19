var jade = require('pug-runtime'); module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<!DOCTYPE html><html><head><title>404 - Event not found</title><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/app-15d9899c.css\" media=\"all\"></head><body class=\"error-404\"><div class=\"container\"><div class=\"row\"><div class=\"col-lg-12 error-frame\"><p class=\"headline\">This event is unaccessible</p><p>Either it does not exist</p><p>or</p><p>You are not invited ;)</p></div></div></div></body></html>");;return buf.join("");
}