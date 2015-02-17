var jade = require('jade/runtime');
module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<!DOCTYPE html><html><head><title>404 - Événement non trouvé</title><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/app.css\" media=\"all\"></head><body class=\"error-404\"><div class=\"container\"><div class=\"row\"><div class=\"col-lg-12 error-frame\"><p class=\"headline\">Cet événement n'est pas accessible</p><p>Il n'existe pas</p><p>ou</p><p>Vous n'y êtes pas convié ;)</p></div></div></div></body></html>");;return buf.join("");
}