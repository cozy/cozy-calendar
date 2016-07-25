# helper file to require moment or moment-timezone
# depending if .tz is defined.

moment = require('moment')
if(moment.tz)
    module.exports = moment
else
    require('cozy-ical') # cozy-ical requires moment
    module.exports = moment
