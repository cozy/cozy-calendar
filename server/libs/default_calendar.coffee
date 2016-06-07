localization = require('cozy-localization-manager').getInstance()

module.exports.getName = ->
    localization.t("default calendar name")
